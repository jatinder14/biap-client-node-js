import mongoose from 'mongoose';
const { Schema } = mongoose;


const preparedCollectorReconSchema = new Schema({
  recon_id: { type: String },
  status: { type: Boolean },
  is_settlement_sent: { type: Boolean, default: false },
  collector_recon: { type: mongoose.Schema.Types.Mixed },
});

const PreparedCollectorRecon = mongoose.model('preparedCollectorRecon', preparedCollectorReconSchema);

export default PreparedCollectorRecon;
