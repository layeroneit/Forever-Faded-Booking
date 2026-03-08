import { defineBackend } from '@aws-amplify/backend';
import * as iam from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data, sendEmailFn } from './data/resource';

const backend = defineBackend({
  auth,
  data,
  sendEmailFn,
});

// Grant the send-email Lambda permission to send email via SES (required for invite emails).
const sendEmailLambda = backend.sendEmailFn.resources.lambda;
sendEmailLambda.addToRolePolicy(
  new iam.PolicyStatement({
    sid: 'AllowSendEmailViaSES',
    actions: ['ses:SendEmail', 'ses:SendRawEmail'],
    resources: ['*'],
  })
);
