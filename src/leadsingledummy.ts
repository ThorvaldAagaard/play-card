import * as tf from '@tensorflow/tfjs';

export class LeadSingleDummy {
    private modelPath: string;
    private model: tf.LayersModel | null = null;
    // Get the URL of the currently executing module
    // const scriptURL = new URL(import.meta.url);
    // const serverURL = scriptURL.origin;

    constructor(modelPath: string) {
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
