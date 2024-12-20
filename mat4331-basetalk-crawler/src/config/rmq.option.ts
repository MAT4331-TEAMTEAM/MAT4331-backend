import { ClientOptions, Transport } from '@nestjs/microservices';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * RabbitMQ option for emitting event from Crawler service to Main service
 */
export const rmqCrawlerToMainOption: {
  name: string;
  transport: Transport;
} & ClientOptions = {
  name: 'CrawlerToMain',
  transport: Transport.RMQ,
  options: {
    urls: [process.env.RABBITMQ_URL], // RabbitMQ URL
    queue: 'crawler_to_main_data_queue', // Queue name
    queueOptions: { durable: true },
    // connection retry options
    socketOptions: {
      heartbeatIntervalInSeconds: 60,
      reconnectTimeInSeconds: 5,
    },
    prefetchCount: 1,
  },
};

/**
 * RabbitMQ option for emitting event from Main service to Crawler service
 */
export const rmqMainToCrawlerOption: {
  name: string;
  transport: Transport;
} & ClientOptions = {
  name: 'MainToCrawler',
  transport: Transport.RMQ,
  options: {
    urls: [process.env.RABBITMQ_URL],
    queue: 'main_to_crawler_data_queue',
    queueOptions: { durable: true },
    // connection retry options
    socketOptions: {
      heartbeatIntervalInSeconds: 60,
      reconnectTimeInSeconds: 5,
    },
    prefetchCount: 1,
  },
};

/**
 * RabbitMQ option for emitting event from Crawler service to AI service
 */
export const rmqCralwerToAiOption: {
  name: string;
  transport: Transport;
} & ClientOptions = {
  name: 'CrawlerToAi',
  transport: Transport.RMQ,
  options: {
    urls: [process.env.RABBITMQ_URL],
    queue: 'crawler_to_ai_data_queue',
    queueOptions: { durable: true },
    // connection retry options
    socketOptions: {
      heartbeatIntervalInSeconds: 60,
      reconnectTimeInSeconds: 5,
    },
    prefetchCount: 1,
  },
};
