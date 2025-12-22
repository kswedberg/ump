import sdk from '@1password/sdk';


export const has1PasswordVars = () => {
  return process.env.OP_NPM_VAULT_ID && process.env.OP_NPM_ITEM_ID && process.env.OP_SERVICE_ACCOUNT_TOKEN;
};

// Creates an authenticated client.
export const getTotp = async() => {
  const vaultId = process.env.OP_NPM_VAULT_ID;
  const itemId = process.env.OP_NPM_ITEM_ID;

  const client = await sdk.createClient({
    auth: process.env.OP_SERVICE_ACCOUNT_TOKEN,
  // Set the following to your own integration name and version.
    integrationName: 'ump',
    integrationVersion: 'v1.0.0',
  });

  const item = await client.items.get(vaultId, itemId);

  let field = item.fields.find((element) => {
    return element.fieldType === sdk.ItemFieldType.Totp;
  });

  return field.details.content?.code;
};
