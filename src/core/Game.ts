import { GameState, BuildingType, ResourceType, GameMode, GoalTier } from '../types';
import { ResourceManager } from './ResourceManager';
import { MapManager } from './MapManager';
import { BuildingManager } from './BuildingManager';
import { BUILDING_DEFINITIONS } from '../data/buildings';
import { getGoalsForTier, checkGoalCompletion } from '../data/goals';

export class Game {
  private resourceManager!: ResourceManager;
  private mapManager!: MapManager;
  private buildingManager!: BuildingManager;
  private gameState!: GameState;
  private lastUpdateTime: number;
  private gameLoop: number | null = null;

  constructor() {
    this.lastUpdateTime = Date.now();
    this.initializeEmptyGame();
  }

  /**
   * 初始化空遊戲狀態（主選單狀態）
   */
  private initializeEmptyGame(): void {
    this.resourceManager = new ResourceManager();
    this.mapManager = new MapManager();
    this.buildingManager = new BuildingManager();

    this.gameState = {
      mode: GameMode.MENU,
      resources: {},
      population: {
        current: 0,
        capacity: 0,
        growth: 0
      },
      buildings: [],
      map: [],
      gameTime: {
        startTime: 0,
        currentTime: 0,
        elapsedTime: 0,
        isPaused: false
      },
      goals: [],
      selectedBuildingType: undefined,
      currentGoalTier: GoalTier.BRONZE,
      mapSeed: 0
    };
  }

  /**
   * 開始新遊戲
   */
  startNewGame(goalTier: GoalTier = GoalTier.BRONZE, mapSeed?: number): void {
    // 創建新的管理器實例
    this.resourceManager = new ResourceManager();
    this.mapManager = new MapManager(30, 20, mapSeed);
    this.buildingManager = new BuildingManager();

    const now = Date.now();
    this.gameState = {
      mode: GameMode.PLAYING,
      resources: this.resourceManager.getAllResources(),
      population: {
        current: 0,
        capacity: 0,
        growth: 0
      },
      buildings: [],
      map: this.mapManager.getMap(),
      gameTime: {
        startTime: now,
        currentTime: now,
        elapsedTime: 0,
        isPaused: false
      },
      goals: getGoalsForTier(goalTier),
      selectedBuildingType: undefined,
      currentGoalTier: goalTier,
      mapSeed: this.mapManager.getMapSeed()
    };

    this.updateGameState();
    console.log(`🎮 新遊戲開始！目標等級: ${goalTier}, 地圖種子: ${this.gameState.mapSeed}`);
  }

  /**
   * 返回主選單
   */
  returnToMenu(): void {
    this.stop();
    this.gameState.mode = GameMode.MENU;
  }

  /**
   * 檢查遊戲是否在主選單
   */
  isInMenu(): boolean {
    return this.gameState.mode === GameMode.MENU;
  }

  /**
   * 檢查遊戲是否正在進行
   */
  isPlaying(): boolean {
    return this.gameState.mode === GameMode.PLAYING;
  }

  /**
   * 開始遊戲循環
   */
  start(): void {
    if (this.gameLoop !== null || this.gameState.mode !== GameMode.PLAYING) {
      return;
    }

    const update = () => {
      if (!this.gameState.gameTime.isPaused && this.gameState.mode === GameMode.PLAYING) {
        this.update();
      }
      this.gameLoop = requestAnimationFrame(update);
    };

    update();
  }

  /**
   * 停止遊戲循環
   */
  stop(): void {
    if (this.gameLoop !== null) {
      cancelAnimationFrame(this.gameLoop);
      this.gameLoop = null;
    }
  }

  /**
   * 暫停/繼續遊戲
   */
  togglePause(): void {
    if (this.gameState.mode === GameMode.PLAYING) {
      this.gameState.gameTime.isPaused = !this.gameState.gameTime.isPaused;
    }
  }

  /**
   * 主要更新循環
   */
  private update(): void {
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastUpdateTime;
    
    // 限制最大deltaTime以避免遊戲跳躍
    const clampedDeltaTime = Math.min(deltaTime, 100);

    // 更新遊戲時間
    this.updateGameTime(currentTime);

    this.updateResources(clampedDeltaTime);
    this.updatePopulation();
    this.updateGoals();
    this.updateGameState();

    this.lastUpdateTime = currentTime;
  }

  /**
   * 更新遊戲時間
   */
  private updateGameTime(currentTime: number): void {
    // 只在非暫停狀態下更新時間
    if (!this.gameState.gameTime.isPaused) {
      // 如果剛從暫停恢復，需要調整開始時間
      if (this.gameState.gameTime.pausedTime) {
        const pauseDuration = currentTime - this.gameState.gameTime.pausedTime;
        this.gameState.gameTime.startTime += pauseDuration;
        this.gameState.gameTime.pausedTime = undefined;
      }
      
      this.gameState.gameTime.currentTime = currentTime;
      this.gameState.gameTime.elapsedTime = currentTime - this.gameState.gameTime.startTime;
    } else {
      // 記錄暫停開始時間
      if (!this.gameState.gameTime.pausedTime) {
        this.gameState.gameTime.pausedTime = currentTime;
      }
    }
  }

  /**
   * 更新目標狀態
   */
  private updateGoals(): void {
    this.gameState.goals.forEach(goal => {
      if (!goal.completed && checkGoalCompletion(goal, this.gameState)) {
        goal.completed = true;
        
        // 給予獎勵
        if (goal.reward) {
          this.resourceManager.addResources(goal.reward);
          console.log(`🎯 目標完成: ${goal.title}! 獲得獎勵!`);
        }
      }
    });

    // 檢查是否所有目標都完成
    const allCompleted = this.gameState.goals.every(goal => goal.completed);
    if (allCompleted && this.gameState.mode === GameMode.PLAYING) {
      this.gameState.mode = GameMode.COMPLETED;
      console.log('🎉 恭喜！所有目標都已完成！');
    }
  }

  /**
   * 更新資源
   */
  private updateResources(deltaTime: number): void {
    const buildings = this.buildingManager.getAllBuildings();

    for (const building of buildings) {
      // 計算生產
      const production = this.buildingManager.calculateProduction(building, deltaTime);
      for (const [resourceType, amount] of Object.entries(production)) {
        this.resourceManager.addResource(resourceType as ResourceType, amount);
      }

      // 計算消耗
      const consumption = this.buildingManager.calculateConsumption(building, deltaTime);
      for (const [resourceType, amount] of Object.entries(consumption)) {
        if (!this.resourceManager.removeResource(resourceType as ResourceType, amount)) {
          // 如果資源不足，建築可能停止工作
          // 這裡可以添加相應的邏輯
        }
      }

      building.lastProductionTime = Date.now();
    }
  }

  /**
   * 更新人口
   */
  private updatePopulation(): void {
    const capacity = this.buildingManager.calculateTotalPopulationCapacity();
    const currentPopulation = this.gameState.population.current;
    
    // 簡單的人口成長邏輯
    if (currentPopulation < capacity) {
      const growthRate = 0.001; // 每毫秒的成長率
      const growth = Math.min(capacity - currentPopulation, growthRate);
      this.gameState.population.current += growth;
    }

    this.gameState.population.capacity = capacity;
    this.gameState.population.growth = capacity > currentPopulation ? 0.001 : 0;
    
    // 更新資源管理器中的人口
    this.resourceManager.setResource(ResourceType.POPULATION, this.gameState.population.current);
  }

  /**
   * 更新遊戲狀態
   */
  private updateGameState(): void {
    this.gameState.resources = this.resourceManager.getAllResources();
    this.gameState.buildings = this.buildingManager.getAllBuildings();
    if (this.gameState.mode === GameMode.PLAYING) {
      this.gameState.map = this.mapManager.getMap();
    }
    
    // 更新倉庫容量效果
    this.updateWarehouseCapacity();
  }

  /**
   * 更新倉庫容量效果
   */
  private updateWarehouseCapacity(): void {
    const warehouseBonus = this.buildingManager.calculateWarehouseCapacity();
    
    // 設置基礎容量（大幅增加以避免後期卡住）
    const baseCapacity: Record<ResourceType, number> = {
      [ResourceType.WOOD]: 2000,     // 從1000增加到2000
      [ResourceType.FOOD]: 1500,     // 從500增加到1500  
      [ResourceType.STONE]: 1500,    // 從800增加到1500
      [ResourceType.IRON]: 800,      // 從300增加到800
      [ResourceType.GOLD]: 1000,     // 從200增加到1000
      [ResourceType.WATER]: 1000,    // 從400增加到1000
      [ResourceType.POPULATION]: 0
    };
    
    // 應用倉庫加成
    for (const [resourceType, bonus] of Object.entries(warehouseBonus)) {
      const baseAmount = baseCapacity[resourceType as ResourceType];
      this.resourceManager.setCapacity(resourceType as ResourceType, baseAmount + bonus);
    }
    
    // 對於沒有倉庫加成的資源，設置基礎容量
    for (const [resourceType, capacity] of Object.entries(baseCapacity)) {
      if (!warehouseBonus[resourceType]) {
        this.resourceManager.setCapacity(resourceType as ResourceType, capacity);
      }
    }
  }

  /**
   * 放置建築
   */
  placeBuilding(type: BuildingType, x: number, y: number): boolean {
    if (this.gameState.mode !== GameMode.PLAYING) {
      return false;
    }

    const definition = BUILDING_DEFINITIONS[type];
    
    // 檢查是否可以解鎖
    if (!this.buildingManager.isBuildingUnlocked(type, this.gameState.population.current, this.buildingManager.getAllBuildings())) {
      return false;
    }

    // 檢查資源是否足夠
    if (!this.resourceManager.hasEnoughResources(definition.cost)) {
      return false;
    }

    // 檢查是否可以放置
    if (!this.mapManager.canPlaceBuilding(x, y, definition.size.width, definition.size.height, definition.requiredTerrain)) {
      return false;
    }

    // 消費資源
    if (!this.resourceManager.consumeResources(definition.cost)) {
      return false;
    }

    // 創建建築
    const building = this.buildingManager.createBuilding(type, { x, y });
    
    // 在地圖上放置建築
    if (this.mapManager.placeBuilding(building, definition.size.width, definition.size.height)) {
      return true;
    } else {
      // 如果放置失敗，退還資源
      this.resourceManager.addResources(definition.cost);
      this.buildingManager.removeBuilding(building.id);
      return false;
    }
  }

  /**
   * 移除建築
   */
  removeBuilding(x: number, y: number): boolean {
    if (this.gameState.mode !== GameMode.PLAYING) {
      return false;
    }

    const building = this.mapManager.getBuildingAt(x, y);
    if (!building) {
      return false;
    }

    const definition = BUILDING_DEFINITIONS[building.type];
    
    // 從地圖移除
    this.mapManager.removeBuilding(x, y, definition.size.width, definition.size.height);
    
    // 從建築管理器移除
    this.buildingManager.removeBuilding(building.id);
    
    // 退還部分資源
    const refund: any = {};
    for (const [resourceType, amount] of Object.entries(definition.cost)) {
      refund[resourceType] = Math.floor(amount * 0.5); // 退還50%
    }
    this.resourceManager.addResources(refund);

    return true;
  }

  /**
   * 設置選中的建築類型
   */
  setSelectedBuildingType(type: BuildingType | undefined): void {
    this.gameState.selectedBuildingType = type;
  }

  /**
   * 獲取遊戲狀態
   */
  getGameState(): GameState {
    return { ...this.gameState };
  }

  /**
   * 獲取格式化的遊戲時間
   */
  getFormattedGameTime(): string {
    const elapsedSeconds = Math.floor(this.gameState.gameTime.elapsedTime / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * 獲取資源管理器
   */
  getResourceManager(): ResourceManager {
    return this.resourceManager;
  }

  /**
   * 獲取地圖管理器
   */
  getMapManager(): MapManager {
    return this.mapManager;
  }

  /**
   * 獲取建築管理器
   */
  getBuildingManager(): BuildingManager {
    return this.buildingManager;
  }

  /**
   * 檢查建築是否可用
   */
  isBuildingAvailable(type: BuildingType): boolean {
    return this.buildingManager.isBuildingUnlocked(
      type, 
      this.gameState.population.current, 
      this.buildingManager.getAllBuildings()
    );
  }

  /**
   * 儲存遊戲
   */
  saveGame(): void {
    if (this.gameState.mode !== GameMode.PLAYING) {
      return;
    }

    const saveData = {
      resources: this.resourceManager.serialize(),
      map: this.mapManager.serialize(),
      buildings: this.buildingManager.serialize(),
      gameState: {
        population: this.gameState.population,
        gameTime: this.gameState.gameTime,
        goals: this.gameState.goals,
        currentGoalTier: this.gameState.currentGoalTier,
        mapSeed: this.gameState.mapSeed
      }
    };

    localStorage.setItem('townGameSave', JSON.stringify(saveData));
    console.log('💾 遊戲已儲存');
  }

  /**
   * 載入遊戲
   */
  loadGame(): boolean {
    try {
      const saveData = localStorage.getItem('townGameSave');
      if (!saveData) {
        return false;
      }

      const data = JSON.parse(saveData);
      
      // 重新創建管理器
      this.resourceManager = new ResourceManager();
      this.mapManager = new MapManager();
      this.buildingManager = new BuildingManager();
      
      // 載入數據
      this.resourceManager.deserialize(data.resources);
      this.mapManager.deserialize(data.map);
      this.buildingManager.deserialize(data.buildings);
      
      if (data.gameState) {
        this.gameState.mode = GameMode.PLAYING;
        this.gameState.population = data.gameState.population || this.gameState.population;
        this.gameState.gameTime = data.gameState.gameTime || this.gameState.gameTime;
        this.gameState.goals = data.gameState.goals || [];
        this.gameState.currentGoalTier = data.gameState.currentGoalTier || GoalTier.BRONZE;
        this.gameState.mapSeed = data.gameState.mapSeed || 0;
      }

      this.updateGameState();
      console.log('📁 遊戲已載入');
      return true;
    } catch (error) {
      console.error('載入遊戲失敗:', error);
      return false;
    }
  }

  /**
   * 檢查是否有存檔
   */
  hasSaveGame(): boolean {
    return localStorage.getItem('townGameSave') !== null;
  }
} 