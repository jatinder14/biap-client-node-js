import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

async function getSignedUrlForUpload(data) {
    // Set AWS credentials
    AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });

    const version = process.env.S3_VERSION;
    const region = process.env.S3_REGION;
    const bucket = process.env.S3_BUCKET;
    const publicPath = process.env.S3_PUBLIC_PATH;

    console.log({ version, region, bucket, publicPath });

    const signedUrlExpireSeconds = 60 * 60;

    let myBucket = bucket;

    console.log(process.env.PROTOCOL_BASE_URL);
    console.log("bucket------>", bucket);
    console.log("data------>", data);

    try {
        const s3 = new AWS.S3({
            useAccelerateEndpoint: false,
            signatureVersion: version,
            region: region
        });

        const myKey = data.path + '/' + uuidv4() + data.fileType.replace(/^\.?/, '.');
        console.log("myKey------>", myKey);
        const params = {
            Bucket: myBucket,
            Key: myKey,
            Expires: signedUrlExpireSeconds
        };
        console.log("params------>", params);

        return await new Promise((resolve, reject) => {
            s3.getSignedUrl('putObject', params, function (err, url) {
                if (err) {
                    console.log('Error getting presigned url from AWS S3', err);
                    reject({ success: false, message: 'Pre-Signed URL error', urls: url });
                } else {
                    const regionString = '-' + region;
                    myBucket = myBucket.replace('/public-assets', '');
                    let publicUrl = `https://${myBucket}.s3${regionString}.amazonaws.com/public-assets/${myKey}`;
                    resolve({
                        success: true,
                        message: 'AWS SDK S3 Pre-signed urls generated successfully.',
                        path: myKey,
                        urls: url,
                        publicUrl: publicUrl
                    });
                }
            });
        });
    } catch (err) {
        return err;
    }
};

export default getSignedUrlForUpload;
