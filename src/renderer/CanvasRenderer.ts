import { Game } from '../core/Game';
import { TerrainType, BuildingType, MapTile } from '../types';
import { BUILDING_DEFINITIONS } from '../data/buildings';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private game: Game;
  private tileSize: number = 32;
  private camera: { x: number; y: number; scale: number };
  private isDragging: boolean = false;
  private lastMousePosition: { x: number; y: number } = { x: 0, y: 0 };

  constructor(game: Game, container: HTMLElement) {
    this.game = game;
    this.camera = { x: 0, y: 0, scale: 1 };

    // 創建canvas元素
    this.canvas = document.createElement('canvas');
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    this.canvas.style.display = 'block';
    this.canvas.style.backgroundColor = '#2c3e50';
    
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('無法獲取Canvas 2D上下文');
    }
    this.ctx = context;

    container.appendChild(this.canvas);

    this.setupEventListeners();
    this.startRenderLoop();
  }

  /**
   * 設置事件監聽器
   */
  private setupEventListeners(): void {
    // 滑鼠滾輪縮放
    this.canvas.addEventListener('wheel', (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? 0.9 : 1.1;
      this.camera.scale = Math.max(0.5, Math.min(2, this.camera.scale * delta));
    });

    // 滑鼠拖拽
    this.canvas.addEventListener('mousedown', (event: MouseEvent) => {
      this.isDragging = true;
      this.lastMousePosition = { x: event.clientX, y: event.clientY };
      this.canvas.style.cursor = 'grabbing';
    });

    this.canvas.addEventListener('mousemove', (event: MouseEvent) => {
      if (this.isDragging) {
        const dx = event.clientX - this.lastMousePosition.x;
        const dy = event.clientY - this.lastMousePosition.y;
        
        this.camera.x += dx;
        this.camera.y += dy;
        
        this.lastMousePosition = { x: event.clientX, y: event.clientY };
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.canvas.style.cursor = 'grab';
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.isDragging = false;
      this.canvas.style.cursor = 'default';
    });

    // 點擊放置建築
    this.canvas.addEventListener('click', (event: MouseEvent) => {
      if (!this.isDragging) {
        this.handleCanvasClick(event);
      }
    });

    // 設置初始游標
    this.canvas.style.cursor = 'grab';
  }

  /**
   * 處理canvas點擊
   */
  private handleCanvasClick(event: MouseEvent): void {
    const gameState = this.game.getGameState();
    if (!gameState.selectedBuildingType) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    const worldPos = this.screenToWorld(canvasX, canvasY);
    const tileX = Math.floor(worldPos.x / this.tileSize);
    const tileY = Math.floor(worldPos.y / this.tileSize);

    this.game.placeBuilding(gameState.selectedBuildingType, tileX, tileY);
  }

  /**
   * 螢幕座標轉世界座標
   */
  private screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.camera.x) / this.camera.scale,
      y: (screenY - this.camera.y) / this.camera.scale
    };
  }

  /**
   * 開始渲染循環
   */
  private startRenderLoop(): void {
    const render = () => {
      this.render();
      requestAnimationFrame(render);
    };
    render();
  }

  /**
   * 主要渲染方法
   */
  private render(): void {
    // 清空畫布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 保存變換狀態
    this.ctx.save();
    
    // 應用攝影機變換
    this.ctx.translate(this.camera.x, this.camera.y);
    this.ctx.scale(this.camera.scale, this.camera.scale);

    this.renderMap();
    this.renderBuildings();
    
    // 恢復變換狀態
    this.ctx.restore();
  }

  /**
   * 渲染地圖
   */
  private renderMap(): void {
    const map = this.game.getMapManager().getMap();
    const mapSize = this.game.getMapManager().getSize();

    for (let y = 0; y < mapSize.height; y++) {
      for (let x = 0; x < mapSize.width; x++) {
        const tile = map[y][x];
        this.renderTile(tile, x * this.tileSize, y * this.tileSize);
      }
    }
  }

  /**
   * 渲染單個地形格子
   */
  private renderTile(tile: MapTile, x: number, y: number): void {
    // 根據地形類型選擇顏色
    let color: string;
    let emoji: string = '';
    
    switch (tile.terrain) {
      case TerrainType.GRASS:
        color = '#90EE90';
        break;
      case TerrainType.WATER:
        color = '#4169E1';
        emoji = '🌊';
        break;
      case TerrainType.FOREST:
        color = '#228B22';
        emoji = '🌲';
        break;
      case TerrainType.MOUNTAIN:
        color = '#696969';
        emoji = '⛰️';
        break;
      case TerrainType.STONE_DEPOSIT:
        color = '#A0A0A0';
        emoji = '🗿';
        break;
      case TerrainType.IRON_DEPOSIT:
        color = '#8B4513';
        emoji = '⚒️';
        break;
      default:
        color = '#90EE90';
    }

    // 繪製地形背景
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, this.tileSize, this.tileSize);

    // 繪製邊框
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, this.tileSize, this.tileSize);

    // 繪製地形圖標
    if (emoji) {
      this.ctx.font = '16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(emoji, x + this.tileSize / 2, y + this.tileSize / 2);
    }
  }

  /**
   * 渲染建築
   */
  private renderBuildings(): void {
    const buildings = this.game.getBuildingManager().getAllBuildings();
    
    for (const building of buildings) {
      this.renderBuilding(building);
    }
  }

  /**
   * 渲染單個建築
   */
  private renderBuilding(building: any): void {
    const definition = BUILDING_DEFINITIONS[building.type as BuildingType];
    const x = building.position.x * this.tileSize;
    const y = building.position.y * this.tileSize;
    const width = definition.size.width * this.tileSize;
    const height = definition.size.height * this.tileSize;

    // 繪製建築背景
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(x, y, width, height);

    // 繪製建築邊框
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);

    // 繪製建築圖標
    this.ctx.font = '24px Arial';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(
      definition.icon,
      x + width / 2,
      y + height / 2
    );

    // 繪製建築名稱（可選）
    if (this.camera.scale > 0.8) {
      this.ctx.font = '10px Arial';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText(
        definition.name,
        x + width / 2,
        y + height + 12
      );
    }
  }

  /**
   * 調整畫布大小
   */
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  /**
   * 獲取畫布元素
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * 銷毀渲染器
   */
  destroy(): void {
    this.canvas.remove();
  }
} 