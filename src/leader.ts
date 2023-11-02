import * as tf from '@tensorflow/tfjs';

export class Leader {
    private modelPath: string;
    private model: tf.LayersModel | null = null;

    constructor(modelPath: string) {
        this.modelPath = 'models/' + modelPath;
    }

    async initialize() {
        await this.loadModel();
    }

    private async loadModel(): Promise<void> {
        this.model = await tf.loadLayersModel(this.modelPath);
    }

    public async predict(inputX: number[], inputB: number[]): Promise<number[][]> {
        if (!this.model) {
            throw new Error('Model is not ready yet. Wait for it to load.');
        }

        const inputXTensor = tf.tensor2d([inputX], [1, inputX.length]);
        const inputBTensor = tf.tensor2d([inputB], [1, inputB.length]);
        const result = this.model.predict([inputXTensor, inputBTensor]);
        console.log("Result: ", result)
        const resultWithSoftmax = tf.softmax(result as tf.Tensor, -1);
        console.log("resultWithSoftmax: ", resultWithSoftmax)
        return resultWithSoftmax.array() as Promise<number[][]>;
    }
}
