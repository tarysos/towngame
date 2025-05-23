import { MapTile, TerrainType, BuildingInstance } from '../types';

export class MapManager {
  private map: MapTile[][];
  private width: number;
  private height: number;
  private mapSeed: number;

  constructor(width: number = 30, height: number = 20, seed?: number) {
    this.width = width;
    this.height = height;
    this.mapSeed = seed || Math.floor(Math.random() * 1000000);
    this.map = [];
    this.generateMap();
  }

  /**
   * 生成地圖（改進算法確保遊戲可完成）
   */
  private generateMap(): void {
    this.map = [];
    
    // 使用種子初始化隨機數生成器
    let seed = this.mapSeed;
    const seededRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    
    // 第一階段：創建基礎地形
    for (let y = 0; y < this.height; y++) {
      const row: MapTile[] = [];
      for (let x = 0; x < this.width; x++) {
        row.push({
          position: { x, y },
          terrain: TerrainType.GRASS, // 默認為草地
          isOccupied: false
        });
      }
      this.map.push(row);
    }

    // 第二階段：確保有足夠的建設用地（中心區域）
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    const buildableRadius = Math.min(this.width, this.height) / 3;

    // 在中心區域確保有大片草地用於建設
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const distanceFromCenter = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        );
        
        if (distanceFromCenter <= buildableRadius) {
          this.map[y][x].terrain = TerrainType.GRASS;
        }
      }
    }

    // 第三階段：添加資源區域（確保平衡分佈）
    this.addResourceDeposits(seededRandom);
    
    // 第四階段：添加裝飾地形
    this.addDecorativeTerrain(seededRandom);
    
    // 第五階段：添加水域（邊緣區域）
    this.addWaterBodies(seededRandom);
  }

  /**
   * 添加資源礦床
   */
  private addResourceDeposits(random: () => number): void {
    const resourceTypes = [
      { type: TerrainType.FOREST, count: 8, minDistance: 3 },
      { type: TerrainType.STONE_DEPOSIT, count: 4, minDistance: 4 },
      { type: TerrainType.IRON_DEPOSIT, count: 5, minDistance: 4 }
    ];

    resourceTypes.forEach(({ type, count, minDistance }) => {
      const placedPositions: { x: number; y: number }[] = [];
      
      for (let i = 0; i < count; i++) {
        let attempts = 0;
        let placed = false;
        
        while (!placed && attempts < 50) {
          const x = Math.floor(random() * this.width);
          const y = Math.floor(random() * this.height);
          
          // 檢查是否距離其他同類資源足夠遠
          const tooClose = placedPositions.some(pos => 
            Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2)) < minDistance
          );
          
          // 避免在地圖邊緣放置資源
          const nearEdge = x < 2 || x >= this.width - 2 || y < 2 || y >= this.height - 2;
          
          if (!tooClose && !nearEdge && this.map[y][x].terrain === TerrainType.GRASS) {
            // 創建資源群組（2x2 或 3x3）
            const groupSize = type === TerrainType.FOREST ? 3 : 2;
            this.createResourceCluster(x, y, type, groupSize);
            placedPositions.push({ x, y });
            placed = true;
          }
          
          attempts++;
        }
      }
    });
  }

  /**
   * 創建資源集群
   */
  private createResourceCluster(centerX: number, centerY: number, type: TerrainType, size: number): void {
    const halfSize = Math.floor(size / 2);
    
    for (let dy = -halfSize; dy <= halfSize; dy++) {
      for (let dx = -halfSize; dx <= halfSize; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        
        if (this.isValidPosition(x, y) && this.map[y][x].terrain === TerrainType.GRASS) {
          this.map[y][x].terrain = type;
        }
      }
    }
  }

  /**
   * 添加裝飾地形
   */
  private addDecorativeTerrain(random: () => number): void {
    // 添加一些山脈作為天然屏障
    const mountainCount = 3;
    
    for (let i = 0; i < mountainCount; i++) {
      const x = Math.floor(random() * this.width);
      const y = Math.floor(random() * this.height);
      
      // 創建小型山脈
      if (this.map[y] && this.map[y][x] && this.map[y][x].terrain === TerrainType.GRASS) {
        this.map[y][x].terrain = TerrainType.MOUNTAIN;
        
        // 添加相鄰的山
        const directions = [[-1,0], [1,0], [0,-1], [0,1]];
        directions.forEach(([dx, dy]) => {
          const nx = x + dx;
          const ny = y + dy;
          if (this.isValidPosition(nx, ny) && random() > 0.5) {
            if (this.map[ny][nx].terrain === TerrainType.GRASS) {
              this.map[ny][nx].terrain = TerrainType.MOUNTAIN;
            }
          }
        });
      }
    }
  }

  /**
   * 添加水域
   */
  private addWaterBodies(random: () => number): void {
    // 在邊緣添加水域
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const isEdge = x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1;
        
        if (isEdge && random() > 0.6) {
          this.map[y][x].terrain = TerrainType.WATER;
        }
      }
    }

    // 添加內陸湖泊
    const lakeCount = 2;
    for (let i = 0; i < lakeCount; i++) {
      const x = Math.floor(random() * (this.width - 4)) + 2;
      const y = Math.floor(random() * (this.height - 4)) + 2;
      
      // 確保不在中心建設區域
      const centerX = Math.floor(this.width / 2);
      const centerY = Math.floor(this.height / 2);
      const distanceFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      
      if (distanceFromCenter > 8) {
        // 創建小湖泊
        this.map[y][x].terrain = TerrainType.WATER;
        if (random() > 0.5 && this.isValidPosition(x + 1, y)) {
          this.map[y][x + 1].terrain = TerrainType.WATER;
        }
        if (random() > 0.5 && this.isValidPosition(x, y + 1)) {
          this.map[y + 1][x].terrain = TerrainType.WATER;
        }
      }
    }
  }

  /**
   * 獲取地圖種子
   */
  getMapSeed(): number {
    return this.mapSeed;
  }

  /**
   * 獲取地圖格子
   */
  getTile(x: number, y: number): MapTile | null {
    if (this.isValidPosition(x, y)) {
      return this.map[y][x];
    }
    return null;
  }

  /**
   * 檢查座標是否有效
   */
  isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * 檢查位置是否可以放置建築
   */
  canPlaceBuilding(x: number, y: number, width: number, height: number, requiredTerrain?: TerrainType[]): boolean {
    // 檢查所有需要的格子
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const checkX = x + dx;
        const checkY = y + dy;
        
        if (!this.isValidPosition(checkX, checkY)) {
          return false;
        }
        
        const tile = this.getTile(checkX, checkY);
        if (!tile || tile.isOccupied) {
          return false;
        }
        
        // 檢查地形要求
        if (requiredTerrain && !requiredTerrain.includes(tile.terrain)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * 放置建築
   */
  placeBuilding(building: BuildingInstance, width: number, height: number): boolean {
    const { x, y } = building.position;
    
    if (!this.canPlaceBuilding(x, y, width, height)) {
      return false;
    }
    
    // 占用所有相關格子
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const tile = this.getTile(x + dx, y + dy);
        if (tile) {
          tile.isOccupied = true;
          if (dx === 0 && dy === 0) {
            // 只在左上角格子放置建築實例
            tile.building = building;
          }
        }
      }
    }
    
    return true;
  }

  /**
   * 移除建築
   */
  removeBuilding(x: number, y: number, width: number, height: number): boolean {
    if (!this.isValidPosition(x, y)) {
      return false;
    }
    
    // 清空所有相關格子
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const tile = this.getTile(x + dx, y + dy);
        if (tile) {
          tile.isOccupied = false;
          delete tile.building;
        }
      }
    }
    
    return true;
  }

  /**
   * 獲取指定位置的建築
   */
  getBuildingAt(x: number, y: number): BuildingInstance | null {
    const tile = this.getTile(x, y);
    return tile?.building || null;
  }

  /**
   * 獲取所有建築
   */
  getAllBuildings(): BuildingInstance[] {
    const buildings: BuildingInstance[] = [];
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.map[y][x];
        if (tile.building) {
          buildings.push(tile.building);
        }
      }
    }
    
    return buildings;
  }

  /**
   * 獲取鄰近的格子
   */
  getNeighbors(x: number, y: number, radius: number = 1): MapTile[] {
    const neighbors: MapTile[] = [];
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx === 0 && dy === 0) continue;
        
        const tile = this.getTile(x + dx, y + dy);
        if (tile) {
          neighbors.push(tile);
        }
      }
    }
    
    return neighbors;
  }

  /**
   * 獲取地圖尺寸
   */
  getSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /**
   * 獲取完整地圖
   */
  getMap(): MapTile[][] {
    return this.map;
  }

  /**
   * 序列化地圖狀態
   */
  serialize(): any {
    return {
      width: this.width,
      height: this.height,
      mapSeed: this.mapSeed,
      map: this.map
    };
  }

  /**
   * 反序列化地圖狀態
   */
  deserialize(data: any): void {
    if (data.width && data.height && data.map) {
      this.width = data.width;
      this.height = data.height;
      this.mapSeed = data.mapSeed || 0;
      this.map = data.map;
    }
  }
} 