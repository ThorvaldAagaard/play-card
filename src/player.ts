import * as tf from '@tensorflow/tfjs';

export class BatchPlayer {
    private name: string;
    private modelPath: string;
    private model: tf.LayersModel | null = null;
    public sequence: number[][]

    constructor(name: string, modelPath: string) {
        this.name = name;
        this.modelPath = 'models/' + modelPath;
        this.sequence = []
    }

    async initialize() {
        await this.loadModel();
    }
    private async loadModel(): Promise<void> {
        this.model = await tf.loadLayersModel(this.modelPath);
    }

    public async predict(inputArray: number[][]): Promise<number[][][]> {
        if (!this.model) {
            throw new Error('Model is not ready yet. Wait for it to load.');
        }

        const numRowsToAdd = 11 - inputArray.length;
        const paddingZeros = Array.from({ length: 298 }, () => 0); // An array of 298 zeros
        const inputTensor = tf.tensor3d([inputArray.concat(Array.from({ length: numRowsToAdd }, () => paddingZeros))]);
        const cardLogit = this.model.predict(inputTensor) as tf.Tensor;
        //console.log(cardLogit)
        const result = this.reshapeCardLogit(cardLogit, inputTensor);
        //console.log(result)
        return result.array() as Promise<number[][][]>;
    }


    protected reshapeCardLogit(cardLogit: tf.Tensor, x: tf.Tensor): tf.Tensor {
        const shape: number[] | undefined = x.shape;
        if (shape && shape.length >= 2) {
            //const reshapedCardLogit = cardLogit.slice([0, 0, 0], [shape[0], shape[1], 32]);
            const reshapedCardLogit = cardLogit.slice([0, shape[1]-1, 0], [shape[0], 1, 32]);

            return reshapedCardLogit;
        } else {
            // Handle the case when x.shape is not defined or doesn't have the expected dimensions.
            throw new Error('Invalid input shape for reshaping cardLogit.');
        }
    }

}
