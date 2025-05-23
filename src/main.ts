import { Game } from './core/Game';
import { CanvasRenderer } from './renderer/CanvasRenderer';
import { UIManager } from './ui/UIManager';
import { MenuManager } from './ui/MenuManager';

/**
 * 主要應用類別
 */
class TownGame {
  private game: Game;
  private renderer: CanvasRenderer | null = null;
  private uiManager: UIManager | null = null;
  private menuManager: MenuManager;

  constructor() {
    // 初始化遊戲核心
    this.game = new Game();

    // 初始化選單管理器
    this.menuManager = new MenuManager(this.game);

    // 設置窗口大小調整
    this.setupWindowResize();

    // 設置事件監聽
    this.setupEventListeners();

    console.log('🏗️ 城市建設遊戲系統啟動完成！');
  }

  /**
   * 設置事件監聽器
   */
  private setupEventListeners(): void {
    // 監聽返回選單事件
    document.addEventListener('returnToMenu', () => {
      this.returnToMenu();
    });

    // 監聽遊戲狀態變化
    setInterval(() => {
      this.checkGameState();
    }, 1000);
  }

  /**
   * 檢查遊戲狀態變化
   */
  private checkGameState(): void {
    // 如果遊戲從選單狀態切換到遊戲狀態，初始化遊戲UI
    if (this.game.isPlaying() && !this.renderer) {
      this.initializeGameComponents();
    }
  }

  /**
   * 初始化遊戲組件（渲染器和UI）
   */
  private initializeGameComponents(): void {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) {
      throw new Error('找不到遊戲容器元素');
    }

    // 初始化渲染器
    this.renderer = new CanvasRenderer(this.game, gameContainer);

    // 初始化UI管理器
    this.uiManager = new UIManager(this.game);

    console.log('🎮 遊戲組件初始化完成！');
    console.log('🎮 遊戲操作說明:');
    console.log('• 使用滑鼠滾輪縮放地圖');
    console.log('• 拖拽地圖進行移動');
    console.log('• 點擊右側建築按鈕選擇要建造的建築');
    console.log('• 點擊相同按鈕可取消選擇');
    console.log('• 點擊地圖空地放置建築');
    console.log('• 查看右側目標面板追蹤進度');
    console.log('• 使用下方控制按鈕管理遊戲');
  }

  /**
   * 返回主選單
   */
  private returnToMenu(): void {
    // 停止遊戲循環
    this.game.stop();

    // 銷毀遊戲組件
    if (this.renderer) {
      this.renderer.destroy();
      this.renderer = null;
    }

    if (this.uiManager) {
      // UIManager沒有destroy方法，但會自動清理
      this.uiManager = null;
    }

    // 返回選單
    this.menuManager.returnToMenu();

    console.log('🏠 已返回主選單');
  }

  /**
   * 設置窗口大小調整
   */
  private setupWindowResize(): void {
    window.addEventListener('resize', () => {
      if (this.renderer) {
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
          this.renderer.resize(gameContainer.clientWidth, gameContainer.clientHeight);
        }
      }
    });
  }

  /**
   * 銷毀遊戲
   */
  destroy(): void {
    this.game.stop();
    
    if (this.renderer) {
      this.renderer.destroy();
      this.renderer = null;
    }

    if (this.uiManager) {
      this.uiManager = null;
    }

    this.menuManager.destroy();
    
    console.log('🎮 遊戲已銷毀');
  }
}

// 等待DOM載入完成後啟動遊戲
document.addEventListener('DOMContentLoaded', () => {
  try {
    const game = new TownGame();
    
    // 將遊戲實例附加到window以便調試
    (window as any).townGame = game;
    
    console.log('✅ 城市建設遊戲啟動成功！');
    console.log('💡 提示：遊戲實例已附加到 window.townGame，可在控制台中調試');
  } catch (error) {
    console.error('遊戲啟動失敗:', error);
    alert('遊戲啟動失敗，請檢查瀏覽器控制台獲取詳細錯誤信息。');
  }
});

// 添加全域錯誤處理
window.addEventListener('error', (event) => {
  console.error('遊戲運行錯誤:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('未處理的Promise錯誤:', event.reason);
}); 