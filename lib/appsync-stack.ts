/**
 * /lib/appsync-stack.ts
 */
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_appsync as appsync, aws_logs as logs } from "aws-cdk-lib";
import * as path from "path";

/**
 * @see https://github.com/allssu/cdk-appsync-js-resolver
 * @description Example of developing an AWS Appsync JavaScript resolver using the AWS CDK
 */
export class AppsyncStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Appsync GraphQL APIa
    const graphqlApi = new appsync.GraphqlApi(this, "GraphqlApi", {
      name: "graphql-api",
      schema: appsync.SchemaFile.fromAsset(
        path.join(__dirname, "./graphql/schema.graphql") // GraphQL 스키마 경로를 지정해준다.
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY, // 잠깐 쓸거라서 API Key 타입으로 생성한다.
          apiKeyConfig: {
            name: "exampleKey",
            expires: cdk.Expiration.after(cdk.Duration.days(7)), // API Key가 탈취되어도 오늘부터 일주일만 사용할 수 있다.
            description: "graphql api example key",
          },
        },
      },

      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL, // console.log 및 console.error을 사용하기 위해 필요하다.
        retention: logs.RetentionDays.ONE_WEEK, // 잠깐 쓸거라서 로그는 오래 보관될 필요가 없다.
      },
    });

    // HTTP Data source (Dog API)
    const dogDataSource = graphqlApi.addHttpDataSource(
      "HttpDataSource",
      "https://dog.ceo",
      {
        name: "DogApiSource",
        description: "Dog API",
      }
    );

    // HTTP Function (Dog API)
    const getDogFunction = dogDataSource.createFunction("GetDogFunction", {
      name: "getDogFunction",
      code: appsync.Code.fromInline(`
      import { util } from '@aws-appsync/utils'
        export function request(ctx) {
          return {
            method: 'GET',
            resourcePath: '/api/breeds/image/random',
          };
        }
        export function response(ctx) {
            return JSON.parse(ctx.result.body);
        }
      `),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });

    // Get Dog API Resolver
    new appsync.Resolver(this, "GetDogResolver", {
      api: graphqlApi,
      typeName: "Query",
      fieldName: "getDog",
      code: appsync.Code.fromInline(`
        export function request(ctx) {
          return {}
        }

        export function response(ctx) {
          return ctx.prev.result;
          }
      `),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [getDogFunction], // 한 개의 Resolver에서 여러가지 Function을 사용할 수 있다.
    });
  }
}
