import * as tf from '@tensorflow/tfjs';

export class Leader {
    private modelPath: string;
    private model: tf.LayersModel | null = null;
    public ready: boolean = false;
    // Get the URL of the currently executing module
    // const scriptURL = new URL(import.meta.url);
    // const serverURL = scriptURL.origin;

    constructor(modelPath: string) {
        this.modelPath = 'http://localhost:8080/' + modelPath; // Add "file://" prefix to the model path
        this.loadModel()
            .then(() => {
                this.ready = true;
            });
    }

    private async loadModel(): Promise<void> {
        this.model = await tf.loadLayersModel(this.modelPath);
    }

    public async predict(inputX: number[], inputB: number[]): Promise<number[][]> {
        if (!this.ready || !this.model) {
            throw new Error('Model is not ready yet. Wait for it to load.');
        }

        const inputXTensor = tf.tensor2d([inputX], [1, inputX.length]);
        const inputBTensor = tf.tensor2d([inputB], [1, inputB.length]);
        const result = this.model.predict([inputXTensor, inputBTensor]);
        const resultWithSoftmax = tf.softmax(result as tf.Tensor, -1);
        return resultWithSoftmax.array() as Promise<number[][]>;
    }
}
