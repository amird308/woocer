import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { Readable } from 'stream';

@Injectable()
export class MinioService {
  private readonly logger: Logger = new Logger(MinioService.name);
  private readonly s3: AWS.S3;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new AWS.S3({
      endpoint: this.configService.get<string>('MINIO_ENDPOINT'),
      accessKeyId: this.configService.get<string>('MINIO_ACCESS_KEY'),
      secretAccessKey: this.configService.get<string>('MINIO_SECRET_KEY'),
      s3ForcePathStyle: true, // needed for MinIO
      signatureVersion: 'v4',
      sslEnabled: true,
    });
  }

  async uploadFile(
    bucketName: string,
    fileName: string,
    fileBuffer: Buffer,
    mimetype: string,
  ): Promise<AWS.S3.ManagedUpload.SendData> {
    const params: AWS.S3.PutObjectRequest = {
      Bucket: bucketName,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimetype,
    };

    try {
      this.logger.log(`Uploading file ${fileName} to bucket ${bucketName}`);
      const response: AWS.S3.ManagedUpload.SendData = await this.s3
        .upload(params)
        .promise();
      this.logger.log(
        `File ${fileName} uploaded successfully to ${response.Location}`,
      );
      return response;
    } catch (error) {
      this.logger.error(`Failed to upload file ${fileName}`, error.stack);
      throw error;
    }
  }

  async getPresignedUrl(
    bucketName: string,
    fileKey: string,
    expiresInSeconds: number = 3600,
  ): Promise<string> {
    const params: AWS.S3.GetObjectRequest = {
      Bucket: bucketName,
      Key: fileKey,
    };

    try {
      this.logger.log(`Generating presigned URL for file ${fileKey}`);
      const url: string = await this.s3.getSignedUrlPromise('getObject', {
        ...params,
        Expires: expiresInSeconds,
      });
      this.logger.log(
        `Presigned URL for file ${fileKey} generated successfully.`,
      );
      return url;
    } catch (error) {
      this.logger.error(
        `Failed to generate presigned URL for file ${fileKey}`,
        error.stack,
      );
      throw error;
    }
  }

  async downloadFile(bucketName: string, fileKey: string): Promise<Readable> {
    const params: AWS.S3.GetObjectRequest = {
      Bucket: bucketName,
      Key: fileKey,
    };

    try {
      this.logger.log(`Downloading file ${fileKey} from bucket ${bucketName}`);
      const response: AWS.S3.GetObjectOutput = await this.s3
        .getObject(params)
        .promise();
      this.logger.log(`File ${fileKey} downloaded successfully.`);
      return response.Body as Readable;
    } catch (error) {
      this.logger.error(`Failed to download file ${fileKey}`, error.stack);
      throw error;
    }
  }

  async deleteFile(
    bucketName: string,
    fileKey: string,
  ): Promise<AWS.S3.DeleteObjectOutput> {
    const params: AWS.S3.DeleteObjectRequest = {
      Bucket: bucketName,
      Key: fileKey,
    };

    try {
      this.logger.log(`Deleting file ${fileKey} from bucket ${bucketName}`);
      const response: AWS.S3.DeleteObjectOutput = await this.s3
        .deleteObject(params)
        .promise();
      this.logger.log(`File ${fileKey} deleted successfully.`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to delete file ${fileKey}`, error.stack);
      throw error;
    }
  }

  /**
   * Get file content as Buffer for processing.
   */
  async getFileAsBuffer(bucketName: string, fileKey: string): Promise<Buffer> {
    const params: AWS.S3.GetObjectRequest = {
      Bucket: bucketName,
      Key: fileKey,
    };

    try {
      this.logger.log(
        `Getting file ${fileKey} as buffer from bucket ${bucketName}`,
      );
      const response: AWS.S3.GetObjectOutput = await this.s3
        .getObject(params)
        .promise();
      this.logger.log(`File ${fileKey} retrieved as buffer successfully.`);

      if (response.Body instanceof Buffer) {
        return response.Body;
      } else if (response.Body) {
        // Convert Readable stream to Buffer
        const chunks: Buffer[] = [];
        const stream = response.Body as Readable;

        return new Promise((resolve, reject) => {
          stream.on('data', (chunk: Buffer) => chunks.push(chunk));
          stream.on('error', reject);
          stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
      } else {
        throw new Error('No file content received');
      }
    } catch (error) {
      this.logger.error(`Failed to get file ${fileKey} as buffer`, error.stack);
      throw error;
    }
  }
}
