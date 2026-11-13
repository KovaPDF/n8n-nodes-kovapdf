# Security

Please report a security problem in this node, or in KovaPDF itself, to
**support@kovapdf.com** (the contact in https://www.kovapdf.com/.well-known/security.txt).
How we handle files, encryption and reports: https://www.kovapdf.com/security

Please do not open a public issue for a security problem. Tell us what you
found, which version of `n8n-nodes-kovapdf` you used, and how to reproduce it;
we answer as soon as we can. Please give us a reasonable time to fix it before
you share details in public.

## How this node handles your key

- The KovaPDF API key is stored as an n8n credential, in a password field, so
  n8n keeps it with its other encrypted credentials. The node never writes it
  anywhere else.
- The key is sent only to `https://api.kovapdf.com`, as a bearer token over
  https.
- Use a test key (it starts with `kova_test_`) while you build a workflow: its
  emails go only to your own address and its documents are stamped TEST.
- If a key may have leaked, delete it in your KovaPDF dashboard at
  https://www.kovapdf.com/dashboard/api and make a new one.
