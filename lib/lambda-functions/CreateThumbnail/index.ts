// dependencies
import { S3Client, GetObjectCommand, PutObjectCommand, PutObjectCommandOutput } from '@aws-sdk/client-s3';
import { DynamoDBClient,  } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import {getSignedUrl, S3RequestPresigner} from "@aws-sdk/s3-request-presigner";
import {parseUrl} from "@smithy/url-parser";
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';
import sharp from 'sharp';
import util from 'util';

const config = {region: process.env.aws_region}

// create S3 client
const s3client = new S3Client(config);

//create Dynamodb clients
const client = new DynamoDBClient(config);
const docClient = DynamoDBDocumentClient.from(client);


//image tableName
const urlReferenceTableName = process.env.tableName

//thumbnail bucket: 
const thumbnailBucketName = process.env.thumbnailBucket

///
//const sourceImagePrefix = "images/";
const thumbnailPrefix = "thumbnails/";



const createThumbnail = async (dstBucket: string, dstKey: string, output_buffer: any  ) =>{
  // Upload the thumbnail image to the destination bucket
try {
    const destParams = {
      Bucket: dstBucket,
      Key: dstKey,
      Body: output_buffer,
      ContentType: "image"
    };

    const putResult = await s3client.send(new PutObjectCommand(destParams));
    console.log(putResult)
    return putResult

  } catch (error) {
  console.log(error);
  return;
  }

}; 


const createPresignedUrl = (region: string, bucketName: string, key: string) => {
  //const client = new S3Client({region});
  const command = new PutObjectCommand({Bucket: bucketName, Key: key});
  return getSignedUrl(s3client, command, {expiresIn: 3600});
};

const storeUrl = async (unsignedUrl: string, signedUrl: string, mediaId: string ) => {
  console.log("Creating Dynamodb Item")
  
      const command = new PutCommand({
        TableName: urlReferenceTableName,
        Item: {
          id: uuidv4(),
          unsignedUrl,
         // signedUrl,
          mediaId
          }
      });
    
      const response = await docClient.send(command);
      console.log(response);
      return response;
  };
  
  



///////////////////////////////////////////////////////////////////////////////////////////////////

// define the handler function
export const handler = async (event: any, context: any) => {

    // Read options from the event parameter and get the source bucket
    console.log("Reading options from event:\n", util.inspect(event, {depth: 5}));
      const srcBucket = event.Records[0].s3.bucket.name;
      
    // Object key may have spaces or unicode non-ASCII characters
    const srcKey    = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
    console.log("srcKey ", srcKey)
    //const dstBucket = srcBucket + "-resized";
    //const dstBucket = srcBucket; 
    const dstBucket = thumbnailBucketName; 


    //const dstKey = (srcKey.startsWith("thumbnails/")) ? srcKey : "thumbnails/" + srcKey;
    const dstKey = thumbnailPrefix + srcKey.split('/').pop();
    //const dstKey = thumbnailPrefix + srcKey.substring(srcKey.lastIndexOf('/') + 1);
    console.log("dstKey ", dstKey)

    // Infer the image type from the file suffix
    const typeMatch = srcKey.match(/\.([^.]*)$/);
    if (!typeMatch) {
      console.log("Could not determine the image type.");
      return;
    }

    // Check that the image type is supported
    const imageType = typeMatch[1].toLowerCase();
    if (imageType != "jpg" && imageType != "png") {
      console.log(`Unsupported image type: ${imageType}`);
      return;
    }

    // Get the image from the source bucket. GetObjectCommand returns a stream.
    try {
          const params = {
            Bucket: srcBucket,
            Key: srcKey
          };
          var response = await s3client.send(new GetObjectCommand(params));
          //var stream: StreamingBlobPayloadOutputTypes | undefined = response.Body;
          var stream = response.Body;

          // Convert stream to buffer to pass to sharp resize function.
          if (stream instanceof Readable) {
            //var content_buffer = Buffer.concat(await stream.toArray());
            var chunks = [];
            for await (const chunk of stream) {
              chunks.push(chunk);
            }
            var content_buffer = Buffer.concat(chunks);
            
          } else {
            throw new Error('Unknown object stream type');
          }

      } catch (error) {
        console.log(error);
        return;
      }

      
    // set thumbnail width. Resize will set the height automatically to maintain aspect ratio.
    const width  = 200;

    // Use the sharp module to resize the image and save in a buffer.
    try {    
      var output_buffer = await sharp(content_buffer).resize(width).toBuffer();
    // console.log("output_buffer: ", output_buffer)
    } catch (error) {
      console.log(error);
      return;
    }

    // Upload the thumbnail image to the destination folder
      const putResult: PutObjectCommandOutput | undefined = await createThumbnail(dstBucket!, dstKey, output_buffer)

    // console.log("putResult: ", putResult)

      if(putResult?.$metadata.httpStatusCode === 200){
        console.log('Successfully created Thumbnail ' + dstBucket + '/' + dstKey);

        const unsignedUrl = `https://${dstBucket}.s3.${process.env.aws_region}.amazonaws.com/${dstKey}`;


        const signedUrl = await createPresignedUrl( process.env.aws_region!, dstBucket!, dstKey );

      const response =  await storeUrl(unsignedUrl, signedUrl, `mediaId${uuidv4()}`)
    //   console.log("Dynamodb response", response)
        console.log('Successfully created to ' + dstBucket + '/' + dstKey + " in dynamodb");
      }
      
      client.destroy()
      s3client.destroy()
      docClient.destroy(); // no-op

};