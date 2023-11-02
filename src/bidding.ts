import * as tf from '@tensorflow/tfjs';

export class Bidder {
    private name: string;
    private modelPath: string;
    private model: tf.LayersModel | null = null;

    constructor(name: string, modelPath: string) {
        this.name = name;
        this.modelPath = 'models/' + modelPath;
    }

    async initialize() {
        await this.loadModel();
    }

    private async loadModel(): Promise<void> {
        this.model = await tf.loadLayersModel(this.modelPath);
    }
    
    public async predict(x: tf.Tensor): Promise<tf.Tensor> {
        if (!this.model) {
            throw new Error('Model is not ready yet. Wait for it to load.');
        }

        const result = this.model.predict(x) as tf.Tensor;
        return result;
    }
}
