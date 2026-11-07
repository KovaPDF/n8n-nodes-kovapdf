import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class KovaPdfApi implements ICredentialType {
	name = 'kovaPdfApi';

	displayName = 'KovaPDF API';

	icon: Icon = { light: 'file:../icons/kovapdf.svg', dark: 'file:../icons/kovapdf.dark.svg' };

	documentationUrl = 'https://www.kovapdf.com/developers/docs';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Your KovaPDF API key. It starts with kova_test_ or kova_live_. Make one in your KovaPDF dashboard under Developer API.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.kovapdf.com/api/v1',
			url: '/me',
		},
	};
}
