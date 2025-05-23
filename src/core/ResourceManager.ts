import { ResourceAmount, ResourceType } from '../types';

export class ResourceManager {
  private resources: ResourceAmount;
  private capacity: ResourceAmount;

  constructor() {
    this.resources = {
      [ResourceType.WOOD]: 80,
      [ResourceType.FOOD]: 50,
      [ResourceType.STONE]: 40,
      [ResourceType.IRON]: 20,
      [ResourceType.GOLD]: 0,
      [ResourceType.WATER]: 20,
      [ResourceType.POPULATION]: 0
    };

    this.capacity = {
      [ResourceType.WOOD]: 2000,
      [ResourceType.FOOD]: 1500,
      [ResourceType.STONE]: 1500,
      [ResourceType.IRON]: 800,
      [ResourceType.GOLD]: 1000,
      [ResourceType.WATER]: 1000,
      [ResourceType.POPULATION]: 0
    };
  }

  /**
   * 獲取指定資源的數量
   */
  getResource(type: ResourceType): number {
    return this.resources[type] || 0;
  }

  /**
   * 獲取所有資源
   */
  getAllResources(): ResourceAmount {
    return { ...this.resources };
  }

  /**
   * 設置資源數量
   */
  setResource(type: ResourceType, amount: number): void {
    const maxAmount = this.capacity[type] || Infinity;
    this.resources[type] = Math.max(0, Math.min(amount, maxAmount));
  }

  /**
   * 增加資源
   */
  addResource(type: ResourceType, amount: number): number {
    const currentAmount = this.getResource(type);
    const maxAmount = this.capacity[type] || Infinity;
    const newAmount = Math.min(currentAmount + amount, maxAmount);
    this.resources[type] = newAmount;
    return newAmount - currentAmount; // 返回實際增加的量
  }

  /**
   * 減少資源
   */
  removeResource(type: ResourceType, amount: number): boolean {
    const currentAmount = this.getResource(type);
    if (currentAmount >= amount) {
      this.resources[type] = currentAmount - amount;
      return true;
    }
    return false;
  }

  /**
   * 檢查是否有足夠的資源
   */
  hasEnoughResources(cost: ResourceAmount): boolean {
    for (const [resourceType, amount] of Object.entries(cost)) {
      if (this.getResource(resourceType as ResourceType) < amount) {
        return false;
      }
    }
    return true;
  }

  /**
   * 消費資源
   */
  consumeResources(cost: ResourceAmount): boolean {
    if (!this.hasEnoughResources(cost)) {
      return false;
    }

    for (const [resourceType, amount] of Object.entries(cost)) {
      this.removeResource(resourceType as ResourceType, amount);
    }
    return true;
  }

  /**
   * 批量增加資源
   */
  addResources(resources: ResourceAmount): void {
    for (const [resourceType, amount] of Object.entries(resources)) {
      this.addResource(resourceType as ResourceType, amount);
    }
  }

  /**
   * 獲取資源容量
   */
  getCapacity(type: ResourceType): number {
    return this.capacity[type] || Infinity;
  }

  /**
   * 設置資源容量
   */
  setCapacity(type: ResourceType, capacity: number): void {
    this.capacity[type] = Math.max(0, capacity);
    // 如果當前資源超過新容量，調整到容量限制
    if (this.resources[type] > capacity) {
      this.resources[type] = capacity;
    }
  }

  /**
   * 增加資源容量
   */
  addCapacity(type: ResourceType, amount: number): void {
    const currentCapacity = this.getCapacity(type);
    this.setCapacity(type, currentCapacity + amount);
  }

  /**
   * 獲取資源使用率 (0-1)
   */
  getUsageRatio(type: ResourceType): number {
    const current = this.getResource(type);
    const max = this.getCapacity(type);
    return max > 0 ? current / max : 0;
  }

  /**
   * 序列化資源狀態
   */
  serialize(): any {
    return {
      resources: this.resources,
      capacity: this.capacity
    };
  }

  /**
   * 反序列化資源狀態
   */
  deserialize(data: any): void {
    if (data.resources) {
      this.resources = { ...data.resources };
    }
    if (data.capacity) {
      this.capacity = { ...data.capacity };
    }
  }
} 