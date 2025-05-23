import { Game } from '../core/Game';
import { ResourceType, BuildingType, TerrainType } from '../types';
import { BUILDING_DEFINITIONS } from '../data/buildings';

export class UIManager {
  private game: Game;
  private resourceDisplay: HTMLElement;
  private buildingButtons: HTMLElement;
  private populationDisplay: HTMLElement;
  private statusMessages: HTMLElement;
  private saveButton: HTMLElement;
  private loadButton: HTMLElement;
  private pauseButton: HTMLElement;
  private timeDisplay: HTMLElement;
  private goalsDisplay: HTMLElement;
  private menuButton: HTMLElement;
  private selectedBuildingType: BuildingType | null = null;
  private lastWarningTime: number = 0;

  constructor(game: Game) {
    this.game = game;
    
    // 獲取UI元素
    this.resourceDisplay = document.getElementById('resource-display')!;
    this.buildingButtons = document.getElementById('building-buttons')!;
    this.populationDisplay = document.getElementById('population-display')!;
    this.statusMessages = document.getElementById('status-messages')!;
    this.saveButton = document.getElementById('save-button')!;
    this.loadButton = document.getElementById('load-button')!;
    this.pauseButton = document.getElementById('pause-button')!;
    this.timeDisplay = document.getElementById('time-display')!;
    this.goalsDisplay = document.getElementById('goals-display')!;
    this.menuButton = document.getElementById('menu-button')!;

    this.setupEventListeners();
    this.createBuildingButtons();
    this.update();
    
    // 定期更新UI
    setInterval(() => this.update(), 100);
  }

  /**
   * 設置事件監聽器
   */
  private setupEventListeners(): void {
    this.saveButton.addEventListener('click', () => {
      this.game.saveGame();
      this.showMessage('遊戲已儲存！');
    });

    this.loadButton.addEventListener('click', () => {
      if (this.game.loadGame()) {
        this.showMessage('遊戲已載入！');
      } else {
        this.showMessage('沒有可載入的存檔');
      }
    });

    this.pauseButton.addEventListener('click', () => {
      this.game.togglePause();
      this.updatePauseButton();
    });

    this.menuButton.addEventListener('click', () => {
      if (confirm('確定要返回主選單嗎？未保存的進度將會丟失。')) {
        // 這裡需要主應用來處理返回選單
        const event = new CustomEvent('returnToMenu');
        document.dispatchEvent(event);
      }
    });
  }

  /**
   * 更新暫停按鈕
   */
  private updatePauseButton(): void {
    const gameState = this.game.getGameState();
    this.pauseButton.textContent = gameState.gameTime.isPaused ? '▶️ 繼續' : '⏸️ 暫停';
  }

  /**
   * 創建建築按鈕
   */
  private createBuildingButtons(): void {
    this.buildingButtons.innerHTML = '';

    Object.values(BuildingType).forEach(buildingType => {
      const definition = BUILDING_DEFINITIONS[buildingType];
      const button = document.createElement('button');
      button.className = 'building-button';
      
      // 檢查解鎖狀態
      const isUnlocked = this.game.isBuildingAvailable(buildingType);
      const hasResources = this.game.getResourceManager().hasEnoughResources(definition.cost);
      
      // 顯示解鎖狀態
      let statusIcon = '';
      let statusText = '';
      
      if (!isUnlocked) {
        statusIcon = '🔒';
        if (definition.unlockRequirement?.population) {
          const currentPop = Math.floor(this.game.getGameState().population.current);
          const requiredPop = definition.unlockRequirement.population;
          statusText = ` (${currentPop}/${requiredPop}人口)`;
        }
      } else if (!hasResources) {
        statusIcon = '💰';
        statusText = ' (資源不足)';
      } else {
        statusIcon = '✅';
      }
      
      button.innerHTML = `${definition.icon} ${definition.name} ${statusIcon}${statusText}`;
      button.title = this.getBuildingTooltip(definition);
      
      button.addEventListener('click', () => {
        this.selectBuilding(buildingType);
      });

      this.buildingButtons.appendChild(button);
    });
  }

  /**
   * 獲取建築工具提示
   */
  private getBuildingTooltip(definition: any): string {
    let tooltip = `${definition.description}\n\n`;
    
    // 顯示解鎖條件
    if (definition.unlockRequirement) {
      tooltip += '🔒 解鎖條件:\n';
      
      if (definition.unlockRequirement.population) {
        const currentPop = Math.floor(this.game.getGameState().population.current);
        const requiredPop = definition.unlockRequirement.population;
        const isUnlocked = currentPop >= requiredPop;
        tooltip += `• 人口: ${currentPop}/${requiredPop} ${isUnlocked ? '✅' : '❌'}\n`;
      }
      
      if (definition.unlockRequirement.buildings) {
        Object.entries(definition.unlockRequirement.buildings).forEach(([buildingType, count]) => {
          const currentCount = this.game.getBuildingManager().getBuildingsByType(buildingType as BuildingType).length;
          const requiredCount = count as number;
          const isUnlocked = currentCount >= requiredCount;
          const buildingDef = BUILDING_DEFINITIONS[buildingType as BuildingType];
          tooltip += `• ${buildingDef.name}: ${currentCount}/${requiredCount} ${isUnlocked ? '✅' : '❌'}\n`;
        });
      }
      
      tooltip += '\n';
    }
    
    tooltip += '💰 建造成本:\n';
    for (const [resourceType, amount] of Object.entries(definition.cost)) {
      const current = Math.floor(this.game.getResourceManager().getResource(resourceType as ResourceType));
      const hasEnough = current >= (amount as number);
      tooltip += `• ${this.getResourceName(resourceType)}: ${current}/${amount} ${hasEnough ? '✅' : '❌'}\n`;
    }

    if (Object.keys(definition.produces).length > 0) {
      tooltip += '\n📈 生產:\n';
      for (const [resourceType, amount] of Object.entries(definition.produces)) {
        tooltip += `• ${this.getResourceName(resourceType)}: ${amount}/秒\n`;
      }
    }

    if (Object.keys(definition.consumes).length > 0) {
      tooltip += '\n📉 消耗:\n';
      for (const [resourceType, amount] of Object.entries(definition.consumes)) {
        tooltip += `• ${this.getResourceName(resourceType)}: ${amount}/秒\n`;
      }
    }

    if (definition.populationEffect !== 0) {
      tooltip += `\n👥 人口效果: ${definition.populationEffect > 0 ? '+' : ''}${definition.populationEffect}`;
    }

    // 顯示地形需求
    if (definition.requiredTerrain && definition.requiredTerrain.length > 0) {
      tooltip += '\n\n🗺️ 地形需求:\n';
      definition.requiredTerrain.forEach((terrain: TerrainType) => {
        const terrainNames: { [key: string]: string } = {
          [TerrainType.GRASS]: '草地',
          [TerrainType.FOREST]: '森林',
          [TerrainType.STONE_DEPOSIT]: '石礦',
          [TerrainType.IRON_DEPOSIT]: '鐵礦',
          [TerrainType.MOUNTAIN]: '山脈',
          [TerrainType.WATER]: '水域'
        };
        tooltip += `• ${terrainNames[terrain] || terrain}\n`;
      });
    }

    return tooltip;
  }

  /**
   * 選擇建築
   */
  private selectBuilding(buildingType: BuildingType): void {
    // 如果已經選中同一個建築，則取消選擇
    if (this.selectedBuildingType === buildingType) {
      this.clearSelection();
      this.showMessage('已取消建築選擇');
      return;
    }

    // 檢查是否可用
    if (!this.game.isBuildingAvailable(buildingType)) {
      this.showMessage('建築尚未解鎖！');
      return;
    }

    // 檢查資源是否足夠
    const definition = BUILDING_DEFINITIONS[buildingType];
    const resourceManager = this.game.getResourceManager();
    if (!resourceManager.hasEnoughResources(definition.cost)) {
      this.showMessage('資源不足！');
      return;
    }

    this.selectedBuildingType = buildingType;
    this.game.setSelectedBuildingType(buildingType);
    
    // 更新按鈕樣式
    this.updateBuildingButtonStyles();
    this.showMessage(`已選擇建築: ${definition.name}（點擊相同按鈕可取消選擇）`);
  }

  /**
   * 更新建築按鈕樣式
   */
  private updateBuildingButtonStyles(): void {
    const buttons = this.buildingButtons.querySelectorAll('.building-button');
    buttons.forEach((button, index) => {
      const buildingTypes = Object.values(BuildingType);
      if (buildingTypes[index] === this.selectedBuildingType) {
        button.classList.add('selected');
      } else {
        button.classList.remove('selected');
      }
    });
  }

  /**
   * 更新UI
   */
  update(): void {
    // 只在遊戲進行中更新UI
    if (!this.game.isPlaying()) {
      return;
    }

    this.updateResourceDisplay();
    this.updatePopulationDisplay();
    this.updateTimeDisplay();
    this.updateGoalsDisplay();
    this.updateBuildingAvailability();
    this.updatePauseButton();
    this.checkCapacityWarnings();
  }

  /**
   * 檢查容量警告
   */
  private checkCapacityWarnings(): void {
    const resources = this.game.getResourceManager().getAllResources();
    const resourceManager = this.game.getResourceManager();
    
    // 檢查是否有任何資源接近滿容量
    let hasWarning = false;
    let nearFullResources: string[] = [];
    
    Object.entries(resources).forEach(([resourceType, amount]) => {
      if (resourceType !== ResourceType.POPULATION) {
        const capacity = resourceManager.getCapacity(resourceType as ResourceType);
        const usageRatio = amount / capacity;
        
        if (usageRatio >= 0.9) {
          hasWarning = true;
          nearFullResources.push(this.getResourceName(resourceType));
        }
      }
    });
    
    // 如果有警告且玩家有足夠人口建倉庫，顯示提示
    if (hasWarning && (!this.lastWarningTime || Date.now() - this.lastWarningTime > 30000)) { // 30秒間隔
      const canBuildWarehouse = this.game.isBuildingAvailable(BuildingType.WAREHOUSE) && 
                               this.game.getResourceManager().hasEnoughResources(BUILDING_DEFINITIONS[BuildingType.WAREHOUSE].cost);
      
      if (canBuildWarehouse) {
        this.showMessage(`⚠️ ${nearFullResources.join('、')}接近滿容量！建議建造倉庫增加儲存空間`);
        this.lastWarningTime = Date.now();
      }
    }
  }

  /**
   * 更新時間顯示
   */
  private updateTimeDisplay(): void {
    const formattedTime = this.game.getFormattedGameTime();
    const gameState = this.game.getGameState();
    const pauseStatus = gameState.gameTime.isPaused ? ' 🚫 (已暫停)' : '';
    
    this.timeDisplay.innerHTML = `
      <div class="time-info">
        <div>⏱️ 遊戲時間: ${formattedTime}${pauseStatus}</div>
        <div>🎯 目標等級: ${this.getTierName(gameState.currentGoalTier)}</div>
        <div>🌍 地圖種子: ${gameState.mapSeed}</div>
      </div>
    `;
  }

  /**
   * 獲取等級名稱
   */
  private getTierName(tier: string): string {
    const tierNames: { [key: string]: string } = {
      'bronze': '🥉 銅級',
      'silver': '🥈 銀級',
      'gold': '🥇 金級'
    };
    return tierNames[tier] || tier;
  }

  /**
   * 更新目標顯示
   */
  private updateGoalsDisplay(): void {
    const gameState = this.game.getGameState();
    
    let html = '<h4>🎯 目標任務</h4>';
    
    if (gameState.goals.length === 0) {
      html += '<p>無目標</p>';
    } else {
      gameState.goals.forEach(goal => {
        const completedClass = goal.completed ? 'completed' : '';
        const completedIcon = goal.completed ? '✅' : '⏳';
        
        html += `
          <div class="goal-item ${completedClass}" style="
            margin: 5px 0;
            padding: 5px;
            background-color: ${goal.completed ? 'rgba(39, 174, 96, 0.3)' : 'rgba(52, 73, 94, 0.8)'};
            border-radius: 3px;
            border-left: 3px solid ${goal.completed ? '#27ae60' : '#f39c12'};
          ">
            <div style="font-weight: bold;">${completedIcon} ${goal.title}</div>
            <div style="font-size: 0.9em; opacity: 0.9;">${goal.description}</div>
            ${this.getGoalProgressText(goal)}
          </div>
        `;
      });

      // 顯示完成進度
      const completedCount = gameState.goals.filter(g => g.completed).length;
      const totalCount = gameState.goals.length;
      html += `
        <div class="goal-progress" style="
          margin-top: 10px;
          padding: 5px;
          background-color: rgba(52, 152, 219, 0.3);
          border-radius: 3px;
          text-align: center;
        ">
          進度: ${completedCount}/${totalCount} (${Math.round(completedCount/totalCount*100)}%)
        </div>
      `;
    }
    
    this.goalsDisplay.innerHTML = html;
  }

  /**
   * 獲取目標進度文本
   */
  private getGoalProgressText(goal: any): string {
    if (goal.completed) {
      return '<div style="font-size: 0.8em; color: #27ae60;">✅ 已完成</div>';
    }

    const gameState = this.game.getGameState();
    const requirements = goal.requirements;
    let progressText = '<div style="font-size: 0.8em; color: #f39c12;">';

    // 人口進度
    if (requirements.population) {
      const current = Math.floor(gameState.population.current);
      const required = requirements.population;
      progressText += `👥 人口: ${current}/${required} `;
    }

    // 資源進度
    if (requirements.resources) {
      Object.entries(requirements.resources).forEach(([resourceType, amount]) => {
        const current = Math.floor(gameState.resources[resourceType] || 0);
        const required = amount as number;
        progressText += `${this.getResourceIcon(resourceType)} ${current}/${required} `;
      });
    }

    // 建築進度
    if (requirements.buildings) {
      Object.entries(requirements.buildings).forEach(([buildingType, amount]) => {
        const current = gameState.buildings.filter(b => b.type === buildingType).length;
        const required = amount as number;
        const definition = BUILDING_DEFINITIONS[buildingType as BuildingType];
        progressText += `${definition.icon} ${current}/${required} `;
      });
    }

    // 時間限制
    if (requirements.timeLimit) {
      const elapsedSeconds = Math.floor(gameState.gameTime.elapsedTime / 1000);
      const limitSeconds = requirements.timeLimit;
      const remainingSeconds = Math.max(0, limitSeconds - elapsedSeconds);
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      progressText += `⏰ 剩餘: ${minutes}:${seconds.toString().padStart(2, '0')} `;
    }

    progressText += '</div>';
    return progressText;
  }

  /**
   * 更新資源顯示
   */
  private updateResourceDisplay(): void {
    const resources = this.game.getResourceManager().getAllResources();
    
    let html = '';
    Object.entries(resources).forEach(([resourceType, amount]) => {
      if (resourceType !== ResourceType.POPULATION) {
        const capacity = this.game.getResourceManager().getCapacity(resourceType as ResourceType);
        const displayAmount = Math.floor(amount);
        const displayCapacity = capacity === Infinity ? '∞' : Math.floor(capacity);
        const usageRatio = amount / capacity;
        
        // 添加容量警告顏色
        let warningStyle = '';
        let warningIcon = '';
        
        if (usageRatio >= 0.95) {
          warningStyle = 'color: #e74c3c; font-weight: bold;'; // 紅色：幾乎滿了
          warningIcon = ' ⚠️';
        } else if (usageRatio >= 0.8) {
          warningStyle = 'color: #f39c12; font-weight: bold;'; // 橙色：接近滿了
          warningIcon = ' ⚡';
        }
        
        html += `
          <div class="resource-item" style="${warningStyle}">
            <span>${this.getResourceIcon(resourceType)} ${this.getResourceName(resourceType)}${warningIcon}</span>
            <span>${displayAmount}/${displayCapacity}</span>
          </div>
        `;
      }
    });
    
    this.resourceDisplay.innerHTML = html;
  }

  /**
   * 更新人口顯示
   */
  private updatePopulationDisplay(): void {
    const gameState = this.game.getGameState();
    const population = gameState.population;
    
    this.populationDisplay.innerHTML = `
      <div class="population-info">
        <div>👥 人口: ${Math.floor(population.current)}/${Math.floor(population.capacity)}</div>
        <div>📈 成長率: ${population.growth > 0 ? '+' : ''}${(population.growth * 1000).toFixed(1)}/秒</div>
      </div>
    `;
  }

  /**
   * 更新建築可用性
   */
  private updateBuildingAvailability(): void {
    const buttons = this.buildingButtons.querySelectorAll('.building-button');
    const buildingTypes = Object.values(BuildingType);
    
    buttons.forEach((button, index) => {
      const buildingType = buildingTypes[index];
      const definition = BUILDING_DEFINITIONS[buildingType];
      const isAvailable = this.game.isBuildingAvailable(buildingType);
      const hasResources = this.game.getResourceManager().hasEnoughResources(definition.cost);
      
      const htmlButton = button as HTMLButtonElement;
      
      // 更新按鈕文本和狀態
      let statusIcon = '';
      let statusText = '';
      
      if (!isAvailable) {
        statusIcon = '🔒';
        if (definition.unlockRequirement?.population) {
          const currentPop = Math.floor(this.game.getGameState().population.current);
          const requiredPop = definition.unlockRequirement.population;
          statusText = ` (${currentPop}/${requiredPop}人口)`;
        }
        htmlButton.setAttribute('disabled', 'true');
        htmlButton.style.opacity = '0.5';
      } else if (!hasResources) {
        statusIcon = '💰';
        statusText = ' (資源不足)';
        htmlButton.removeAttribute('disabled');
        htmlButton.style.opacity = '0.7';
      } else {
        statusIcon = '✅';
        htmlButton.removeAttribute('disabled');
        htmlButton.style.opacity = '1';
      }
      
      htmlButton.innerHTML = `${definition.icon} ${definition.name} ${statusIcon}${statusText}`;
      htmlButton.title = this.getBuildingTooltip(definition);
    });
  }

  /**
   * 顯示消息
   */
  private showMessage(message: string): void {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.cssText = `
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px;
      margin: 5px 0;
      border-radius: 5px;
      animation: fadeOut 3s ease-out forwards;
    `;
    
    this.statusMessages.appendChild(messageElement);
    
    // 3秒後移除消息
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.parentNode.removeChild(messageElement);
      }
    }, 3000);
    
    // 添加CSS動畫
    if (!document.getElementById('message-styles')) {
      const style = document.createElement('style');
      style.id = 'message-styles';
      style.textContent = `
        @keyframes fadeOut {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * 獲取資源圖標
   */
  private getResourceIcon(resourceType: string): string {
    const icons: { [key: string]: string } = {
      [ResourceType.WOOD]: '🪵',
      [ResourceType.FOOD]: '🌾',
      [ResourceType.STONE]: '🗿',
      [ResourceType.IRON]: '⚙️',
      [ResourceType.GOLD]: '💰',
      [ResourceType.WATER]: '💧',
      [ResourceType.POPULATION]: '👥'
    };
    return icons[resourceType] || '❓';
  }

  /**
   * 獲取資源名稱
   */
  private getResourceName(resourceType: string): string {
    const names: { [key: string]: string } = {
      [ResourceType.WOOD]: '木材',
      [ResourceType.FOOD]: '食物',
      [ResourceType.STONE]: '石材',
      [ResourceType.IRON]: '鐵礦',
      [ResourceType.GOLD]: '金幣',
      [ResourceType.WATER]: '水源',
      [ResourceType.POPULATION]: '人口'
    };
    return names[resourceType] || '未知';
  }

  /**
   * 清除建築選擇
   */
  clearSelection(): void {
    this.selectedBuildingType = null;
    this.game.setSelectedBuildingType(undefined);
    this.updateBuildingButtonStyles();
  }
} 