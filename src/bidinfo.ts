import * as tf from '@tensorflow/tfjs';

export class BidInfo {
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

    public async predict(x: tf.Tensor): Promise<[tf.Tensor, tf.Tensor]> {
        if (!this.model) {
            throw new Error('Model is not ready yet. Wait for it to load.');
        }

        const [out_hcp_seq, out_shape_seq] = this.model.predict(x) as tf.Tensor[];
        return [out_hcp_seq, out_shape_seq];
    }

}
