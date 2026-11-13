# n8n-nodes-kovapdf

An n8n community node for [KovaPDF](https://www.kovapdf.com): send a PDF for signature, follow signature requests, download the signed document and verify the signatures in any PDF.

## Credentials

Make an API key in your KovaPDF dashboard at [www.kovapdf.com/dashboard/api](https://www.kovapdf.com/dashboard/api). A test key, which starts with `kova_test_`, is free: its emails go only to your own address and its documents are stamped TEST. For live access, ask at [www.kovapdf.com/developers/request-access](https://www.kovapdf.com/developers/request-access).

## Operations

* Send for Signature
* Get Signature Request
* List Signature Requests
* Download Document
* Verify Signatures

## Fields per operation

| Operation | Required fields | Optional fields |
|---|---|---|
| Send for Signature | Input Binary Field (the PDF, default `data`), Title, Signer Name, Signer Email | Page (default 1), X and Y (the signature box position in points from the left and bottom edges of the page, default 72) |
| Get Signature Request | Signature Request ID | |
| List Signature Requests | none | |
| Download Document | Signature Request ID | Version: Original, Current or Final (default Final) |
| Verify Signatures | Input Binary Field (the PDF, default `data`) | |

Send for Signature and Verify Signatures read the PDF from a binary field of the incoming item. The field is called `data` unless you change Input Binary Field. Nodes such as **Read/Write Files from Disk** and **HTTP Request** (with Response Format set to File) put the file there.

## Example: send a PDF for signature and follow it

1. **Read/Write Files from Disk**: Operation **Read File(s) From Disk**, File(s) Selector `/files/contract.pdf`. The PDF arrives in the binary field `data`.
2. **KovaPDF**: Operation **Send for Signature**, Input Binary Field `data`, Title `Service agreement`, Signer Name `Alex Morgan`, Signer Email `alex@example.com`, Page `1`, X `72`, Y `72`. The output item holds the new request, including its `id`.
3. **KovaPDF**: Operation **Get Signature Request**, Signature Request ID `{{ $json.id }}`. The output shows the request status and each signer.
4. Once everyone has signed, **KovaPDF**: Operation **Download Document**, Signature Request ID `{{ $json.id }}`, Version **Final**. The signed PDF arrives as binary data, ready for a Write File, email or storage node.

With a test key (`kova_test_`), the signing email goes only to your own address, so you can run this example safely.

## Example: check the signatures in a PDF

1. **HTTP Request**: Method `GET`, URL of the PDF, Response Format **File**. The PDF arrives in the binary field `data`.
2. **KovaPDF**: Operation **Verify Signatures**, Input Binary Field `data`. The output lists each signature, who signed, whether the document changed after signing and whether the certificate is trusted.

## Documentation

[www.kovapdf.com/developers/docs](https://www.kovapdf.com/developers/docs)

## Installation

In n8n, open **Settings > Community nodes**, choose **Install** and enter `n8n-nodes-kovapdf`. See the [n8n community nodes guide](https://docs.n8n.io/integrations/community-nodes/installation/) for details.

## Compatibility

Built with the n8n node CLI and tested on current n8n 1.x releases.

## Licence

MIT for the code. The KovaPDF name and logo are not covered by that licence (see NOTICE).
