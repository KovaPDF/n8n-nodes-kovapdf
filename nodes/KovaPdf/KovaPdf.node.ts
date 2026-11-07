import type {
	IDataObject,
	JsonObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

const BASE_URL = 'https://api.kovapdf.com/api/v1';

/**
 * KovaPDF for n8n: only the documented API (https://www.kovapdf.com/developers/docs),
 * with the API key as a Bearer token. Files are sent as base64 inside JSON,
 * which the API accepts on the calls that take a file.
 */
export class KovaPdf implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'KovaPDF',
		name: 'kovaPdf',
		icon: { light: 'file:kovapdf.svg', dark: 'file:kovapdf.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Send PDFs for signature, follow them and verify signatures with KovaPDF',
		defaults: { name: 'KovaPDF' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'kovaPdfApi', required: true }],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'send',
				options: [
					{
						name: 'Download Document',
						value: 'download',
						action: 'Download the document',
						description: 'Download the PDF of a signature request',
					},
					{
						name: 'Get Signature Request',
						value: 'get',
						action: 'Get a signature request',
						description: 'Get one signature request with its signers and audit trail',
					},
					{
						name: 'List Signature Requests',
						value: 'list',
						action: 'List signature requests',
						description: 'List your signature requests, newest first',
					},
					{
						name: 'Send for Signature',
						value: 'send',
						action: 'Send a document for signature',
						description: 'Send a PDF to one person to sign',
					},
					{
						name: 'Verify Signatures',
						value: 'verify',
						action: 'Verify the signatures in a PDF',
						description: 'Check every digital signature in a PDF',
					},
				],
			},
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: { show: { operation: ['send', 'verify'] } },
				description: 'The binary field that holds the PDF',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { operation: ['send'] } },
				description: 'The title the signer sees, also the email subject',
			},
			{
				displayName: 'Signer Name',
				name: 'signerName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { operation: ['send'] } },
			},
			{
				displayName: 'Signer Email',
				name: 'signerEmail',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				required: true,
				displayOptions: { show: { operation: ['send'] } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				displayOptions: { show: { operation: ['send'] } },
				description: 'The page of the signature box, from 1',
			},
			{
				displayName: 'X',
				name: 'x',
				type: 'number',
				default: 72,
				displayOptions: { show: { operation: ['send'] } },
				description: 'The distance of the signature box from the left edge of the page, in points',
			},
			{
				displayName: 'Y',
				name: 'y',
				type: 'number',
				default: 72,
				displayOptions: { show: { operation: ['send'] } },
				description:
					'The distance of the signature box from the bottom edge of the page, in points',
			},
			{
				displayName: 'Signature Request ID',
				name: 'id',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { operation: ['get', 'download'] } },
			},
			{
				displayName: 'Version',
				name: 'version',
				type: 'options',
				default: 'final',
				displayOptions: { show: { operation: ['download'] } },
				options: [
					{ name: 'Original', value: 'original', description: 'The file as sent' },
					{ name: 'Current', value: 'current', description: 'Every signature so far' },
					{
						name: 'Final',
						value: 'final',
						description: 'The finished document, once everyone has signed',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const out: INodeExecutionData[] = [];
		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const call = (opts: Omit<IHttpRequestOptions, 'url'> & { url: string }) =>
					this.helpers.httpRequestWithAuthentication.call(this, 'kovaPdfApi', {
						...opts,
						url: `${BASE_URL}${opts.url}`,
					});
				// The largest PDF each API route accepts: refused here, before it is encoded and sent.
				const fileOf = async (maxMb: number) => {
					const field = this.getNodeParameter('binaryPropertyName', i) as string;
					const meta = this.helpers.assertBinaryData(i, field);
					const buffer = await this.helpers.getBinaryDataBuffer(i, field);
					if (buffer.length > maxMb * 1024 * 1024) {
						throw new NodeOperationError(
							this.getNode(),
							`The file is larger than ${maxMb} MB. This operation accepts PDFs up to ${maxMb} MB.`,
							{ itemIndex: i },
						);
					}
					return {
						name: meta.fileName ?? 'document.pdf',
						contentBase64: buffer.toString('base64'),
					};
				};
				if (operation === 'send') {
					const body = {
						file: await fileOf(15),
						spec: {
							title: this.getNodeParameter('title', i) as string,
							sequential: true,
							signers: [
								{
									name: this.getNodeParameter('signerName', i) as string,
									email: this.getNodeParameter('signerEmail', i) as string,
									order: 1,
								},
							],
							fields: [
								{
									signer: 0,
									kind: 'SIGNATURE',
									page: this.getNodeParameter('page', i) as number,
									x: this.getNodeParameter('x', i) as number,
									y: this.getNodeParameter('y', i) as number,
									width: 180,
									height: 48,
								},
							],
						},
					};
					out.push({
						json: (await call({
							method: 'POST',
							url: '/sign-requests',
							body,
							json: true,
						})) as IDataObject,
						pairedItem: i,
					});
				} else if (operation === 'get') {
					const id = encodeURIComponent(this.getNodeParameter('id', i) as string);
					out.push({
						json: (await call({
							method: 'GET',
							url: `/sign-requests/${id}`,
							json: true,
						})) as IDataObject,
						pairedItem: i,
					});
				} else if (operation === 'list') {
					const { requests } = (await call({
						method: 'GET',
						url: '/sign-requests',
						json: true,
					})) as { requests: IDataObject[] };
					for (const r of requests) out.push({ json: r, pairedItem: i });
				} else if (operation === 'download') {
					const id = this.getNodeParameter('id', i) as string;
					const version = this.getNodeParameter('version', i) as string;
					const pdf = (await call({
						method: 'GET',
						url: `/sign-requests/${encodeURIComponent(id)}/document`,
						qs: { version },
						encoding: 'arraybuffer',
						json: false,
					})) as ArrayBuffer;
					const binary = await this.helpers.prepareBinaryData(
						Buffer.from(pdf),
						`${id}-${version}.pdf`,
						'application/pdf',
					);
					out.push({ json: { id, version }, binary: { data: binary }, pairedItem: i });
				} else if (operation === 'verify') {
					out.push({
						json: (await call({
							method: 'POST',
							url: '/verify',
							body: { file: await fileOf(50) },
							json: true,
						})) as IDataObject,
						pairedItem: i,
					});
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
						itemIndex: i,
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					out.push({ json: { error: (error as Error).message }, pairedItem: i });
					continue;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}
		return [out];
	}
}
