export type InputAction = 'moveLeft' | 'moveRight' | 'moveUp' | 'moveDown' | 'fire' | 'stopMove';

export class InputManager {
  readonly keys = new Set<string>();
  mouseX = 0;
  mouseY = 0;
  firing = false;

  private onKeyDown: (e: KeyboardEvent) => void;
  private onKeyUp: (e: KeyboardEvent) => void;
  private onMouseMove: (e: MouseEvent) => void;
  private onMouseDown: (e: MouseEvent) => void;
  private onMouseUp: (e: MouseEvent) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.onKeyDown = (e: KeyboardEvent) => {
      this.keys.add(e.code);
      if (e.code === 'Space') this.firing = true;
    };
    this.onKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
      if (e.code === 'Space') this.firing = false;
    };
    this.onMouseMove = (e: MouseEvent) => {
      this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    this.onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) this.firing = true;
    };
    this.onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) this.firing = false;
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('mousedown', this.onMouseDown);
    canvas.addEventListener('mouseup', this.onMouseUp);
  }

  isDown(code: string): boolean {
    return this.keys.has(code);
  }

  get moveLeft(): boolean { return this.isDown('KeyA') || this.isDown('ArrowLeft'); }
  get moveRight(): boolean { return this.isDown('KeyD') || this.isDown('ArrowRight'); }
  get moveUp(): boolean { return this.isDown('KeyW') || this.isDown('ArrowUp'); }
  get moveDown(): boolean { return this.isDown('KeyS') || this.isDown('ArrowDown'); }

  injectAction(action: InputAction): void {
    switch (action) {
      case 'moveLeft':  this.keys.add('KeyA'); break;
      case 'moveRight': this.keys.add('KeyD'); break;
      case 'moveUp':    this.keys.add('KeyW'); break;
      case 'moveDown':  this.keys.add('KeyS'); break;
      case 'fire':      this.firing = true; break;
      case 'stopMove':
        this.keys.delete('KeyA');
        this.keys.delete('KeyD');
        this.keys.delete('KeyW');
        this.keys.delete('KeyS');
        break;
    }
  }
}
