import { BuildingInstance, BuildingType, BuildingStatus, Position, ResourceAmount, ResourceType } from '../types';
import { BUILDING_DEFINITIONS } from '../data/buildings';

// 簡單的ID生成函數
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export class BuildingManager {
  private buildings: Map<string, BuildingInstance>;

  constructor() {
    this.buildings = new Map();
  }

  /**
   * 創建新建築
   */
  createBuilding(type: BuildingType, position: Position): BuildingInstance {
    const building: BuildingInstance = {
      id: generateId(),
      type,
      position,
      status: BuildingStatus.ACTIVE,
      level: 1,
      lastProductionTime: Date.now(),
      storage: {}
    };

    this.buildings.set(building.id, building);
    return building;
  }

  /**
   * 獲取建築
   */
  getBuilding(id: string): BuildingInstance | undefined {
    return this.buildings.get(id);
  }

  /**
   * 獲取所有建築
   */
  getAllBuildings(): BuildingInstance[] {
    return Array.from(this.buildings.values());
  }

  /**
   * 獲取指定類型的建築
   */
  getBuildingsByType(type: BuildingType): BuildingInstance[] {
    return this.getAllBuildings().filter(building => building.type === type);
  }

  /**
   * 移除建築
   */
  removeBuilding(id: string): boolean {
    return this.buildings.delete(id);
  }

  /**
   * 獲取建築定義
   */
  getBuildingDefinition(type: BuildingType) {
    return BUILDING_DEFINITIONS[type];
  }

  /**
   * 檢查建築是否可以解鎖
   */
  isBuildingUnlocked(type: BuildingType, currentPopulation: number, existingBuildings: BuildingInstance[]): boolean {
    const definition = this.getBuildingDefinition(type);
    const requirement = definition.unlockRequirement;

    if (!requirement) {
      return true; // 沒有解鎖要求
    }

    // 檢查人口要求
    if (requirement.population && currentPopulation < requirement.population) {
      return false;
    }

    // 檢查建築要求
    if (requirement.buildings) {
      for (const [requiredType, requiredCount] of Object.entries(requirement.buildings)) {
        const count = existingBuildings.filter(b => b.type === requiredType).length;
        if (count < requiredCount) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 計算建築生產
   */
  calculateProduction(building: BuildingInstance, deltaTime: number): ResourceAmount {
    const definition = this.getBuildingDefinition(building.type);
    const production: ResourceAmount = {};

    if (building.status !== BuildingStatus.ACTIVE) {
      return production;
    }

    // 計算基於時間的生產量 (每秒)
    const timeMultiplier = deltaTime / 1000;

    for (const [resourceType, rate] of Object.entries(definition.produces)) {
      production[resourceType] = rate * timeMultiplier;
    }

    return production;
  }

  /**
   * 計算建築消耗
   */
  calculateConsumption(building: BuildingInstance, deltaTime: number): ResourceAmount {
    const definition = this.getBuildingDefinition(building.type);
    const consumption: ResourceAmount = {};

    if (building.status !== BuildingStatus.ACTIVE) {
      return consumption;
    }

    // 計算基於時間的消耗量 (每秒)
    const timeMultiplier = deltaTime / 1000;

    for (const [resourceType, rate] of Object.entries(definition.consumes)) {
      consumption[resourceType] = rate * timeMultiplier;
    }

    return consumption;
  }

  /**
   * 更新建築狀態
   */
  updateBuilding(_building: BuildingInstance): void {
    // 這裡可以添加建築狀態更新邏輯
    // 例如：檢查是否有足夠資源運行、維護狀態等
  }

  /**
   * 計算總人口容量
   */
  calculateTotalPopulationCapacity(): number {
    let capacity = 0;
    
    for (const building of this.getAllBuildings()) {
      if (building.status === BuildingStatus.ACTIVE) {
        const definition = this.getBuildingDefinition(building.type);
        capacity += definition.populationEffect;
      }
    }
    
    return Math.max(0, capacity);
  }

  /**
   * 獲取活躍建築數量統計
   */
  getBuildingCounts(): Record<BuildingType, number> {
    const counts: Record<string, number> = {};
    
    // 初始化所有建築類型為0
    Object.values(BuildingType).forEach(type => {
      counts[type] = 0;
    });
    
    // 計算實際數量
    for (const building of this.getAllBuildings()) {
      if (building.status === BuildingStatus.ACTIVE) {
        counts[building.type]++;
      }
    }
    
    return counts as Record<BuildingType, number>;
  }

  /**
   * 升級建築
   */
  upgradeBuilding(id: string): boolean {
    const building = this.getBuilding(id);
    if (!building) {
      return false;
    }
    
    // 簡單的升級邏輯
    building.level++;
    return true;
  }

  /**
   * 設置建築狀態
   */
  setBuildingStatus(id: string, status: BuildingStatus): boolean {
    const building = this.getBuilding(id);
    if (!building) {
      return false;
    }
    
    building.status = status;
    return true;
  }

  /**
   * 序列化建築管理器狀態
   */
  serialize(): any {
    return {
      buildings: Array.from(this.buildings.entries())
    };
  }

  /**
   * 反序列化建築管理器狀態
   */
  deserialize(data: any): void {
    if (data.buildings) {
      this.buildings.clear();
      for (const [id, building] of data.buildings) {
        this.buildings.set(id, building);
      }
    }
  }

  /**
   * 計算所有倉庫提供的額外容量
   */
  calculateWarehouseCapacity(): ResourceAmount {
    const warehouseBonus: ResourceAmount = {};
    const warehouses = this.getBuildingsByType(BuildingType.WAREHOUSE);
    
    for (const warehouse of warehouses) {
      if (warehouse.status === BuildingStatus.ACTIVE) {
        // 每個倉庫增加各種資源的儲存容量
        warehouseBonus[ResourceType.WOOD] = (warehouseBonus[ResourceType.WOOD] || 0) + 200;
        warehouseBonus[ResourceType.FOOD] = (warehouseBonus[ResourceType.FOOD] || 0) + 150;
        warehouseBonus[ResourceType.STONE] = (warehouseBonus[ResourceType.STONE] || 0) + 200;
        warehouseBonus[ResourceType.IRON] = (warehouseBonus[ResourceType.IRON] || 0) + 100;
        warehouseBonus[ResourceType.GOLD] = (warehouseBonus[ResourceType.GOLD] || 0) + 100;
        warehouseBonus[ResourceType.WATER] = (warehouseBonus[ResourceType.WATER] || 0) + 100;
      }
    }
    
    return warehouseBonus;
  }
} 