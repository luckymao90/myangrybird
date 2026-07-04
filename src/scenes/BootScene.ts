import Phaser from 'phaser';
import { generateAllTextures } from '../textures';
import { loadMuted } from '../audio';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    loadMuted();
    generateAllTextures(this);
    if (this.input.mouse) this.input.mouse.disableContextMenu();
    this.scene.start('Menu');
  }
}
