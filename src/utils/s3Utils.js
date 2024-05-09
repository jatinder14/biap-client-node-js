import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

async function uploadImageToS3(imagePath, bucketName, keyName) {
    // Create an S3 instance
    const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    // Read the image file
    const fileContent = fs.readFileSync(imagePath);

    // Prepare the upload parameters
    const params = {
        Bucket: bucketName,
        Key: keyName,
        Body: fileContent
    };

    try {
        // Upload the image to S3
        const data = await s3.upload(params).promise();
        console.log('Image uploaded successfully:', data);
        let imageUrl= await getSignedUrl(data.Key);
        return { success: true, message: 'Image uploaded successfully', imageUrl: imageUrl };
        
    } catch (err) {
        console.error('Error uploading image to S3:', err);
        return { success: false, message: 'Error uploading image to S3', error: err };
    }
}

async function getSignedUrl(fileKey){
    const signedUrlExpireSeconds = 60 * 12
        const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.S3_REGION,
            signatureVersion: process.env.S3_VERSION
    });

    const url = s3.getSignedUrl('getObject', {
        Bucket: process.env.S3_BUCKET,
        Key: fileKey,
        Expires: signedUrlExpireSeconds
    });
    return url;
    // console.log(url,"bhaskalhfalsdh",fileKey)
}

async function getSignedUrlForUpload(data) {
    // Set AWS credentials
    // AWS.config.update({
    //     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    // });

    // const version = process.env.S3_VERSION;
    // const region = process.env.S3_REGION;
    // const bucket = process.env.S3_BUCKET;
    // const publicPath = process.env.S3_PUBLIC_PATH;

    // const imagePath = '/a.jpeg';
const imagePath = data.fileType.path;
const bucketName = 'wil-bharatham-preprod';
const keyName = data.fileType.originalname; // Specify the key (path) in the bucket where you want to store the image
    let result = await uploadImageToS3(imagePath, 'wil-bharatham-preprod', keyName)
    console.log(result)
            return  await new Promise((resolve, reject) => {
            resolve({
                success: true,
                message: 'AWS SDK S3 Pre-signed urls generated successfully.',
                publicUrl: result.imageUrl,
                urls: result.imageUrl
            });
        });
    
    // AWS.config.update({
    //     accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'AKIASUMEMDRDTKC7YPV5',
    //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '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'        
    // });

    // const version = process.env.S3_VERSION || 'v4';
    // const region = process.env.S3_REGION || 'ap-south-1';
    // const bucket = process.env.S3_BUCKET || 'wil-bharatham-preprod';
    // const publicPath = process.env.S3_PUBLIC_PATH || '';

    // console.log({ version, region, bucket, publicPath });

    // const signedUrlExpireSeconds = 60 * 60;

    // let myBucket = bucket;

    // console.log(process.env.PROTOCOL_BASE_URL);
    // console.log("bucket------>", bucket);
    // console.log("data------>", data);

    // try {
    //     const s3 = new AWS.S3({
    //         useAccelerateEndpoint: false,
    //         signatureVersion: version,
    //         region: region
    //     });

    //     const myKey = data.path + '/' + uuidv4() + data.fileType.replace(/^\.?/, '.');
    //     console.log("myKey------>", myKey);
    //     const params = {
    //         Bucket: myBucket,
    //         Key: myKey,
    //         ACL: 'public-read',
    //         Expires: signedUrlExpireSeconds
    //     };
    //     console.log("params------>", params);

    //     return await new Promise((resolve, reject) => {
    //         s3.getSignedUrl('putObject', params, function (err, url) {
    //             if (err) {
    //                 console.log('Error getting presigned url from AWS S3', err);
    //                 reject({ success: false, message: 'Pre-Signed URL error', urls: url });
    //             } else {
    //                 const regionString = '-' + region;
    //                 myBucket = myBucket.replace('/public-assets', '');
    //                 let publicUrl = `https://${myBucket}.s3${regionString}.amazonaws.com/public-assets/${myKey}`;
    //                 resolve({
    //                     success: true,
    //                     message: 'AWS SDK S3 Pre-signed urls generated successfully.',
    //                     path: myKey,
    //                     urls: url,
    //                     publicUrl: publicUrl
    //                 });
    //             }
    //         });
    //     });
    // } catch (err) {
    //     return err;
    // }
};

export default getSignedUrlForUpload;
