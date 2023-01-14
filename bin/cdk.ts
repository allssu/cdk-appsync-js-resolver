#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AppsyncStack } from "../lib/appsync-stack";

const app = new cdk.App();

new AppsyncStack(app, "ExampleAppsyncStack", {
  description: "AWS Appsync Graphql API Stack",
});
