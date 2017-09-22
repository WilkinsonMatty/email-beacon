
This service allows the user to get a URL to serve as a trackable web beacon. The beacon is a 1x1 gif that can be used
in the src attribute of an email <img> tag.

Request a new token by calling the "getTracker" endpoint with a querystring containing the recipient's email address"

Example:

https://localhost:3000/getTracker?emailAddress=firefox3@example.com

This will return the raw token as a string. That token value can be used in the tracking URL, as in the following:

https://localhost:3000/t/<token>

e.g. you can embed the following in an email:

<img src='https://localhost:3000/t/f8db3b5db0d3cd47ce5016dc14982f070b0bda1493d8c88628d98cc0a9771d7f3e684698c1974103dfa58920fd1fe573'></img>


Each time the URL is accessed, the recipient email address will receive an email telling them...

- whether it's the first open (access) or a subsequent one
- IP and timestamp information
- if it's not the first access, whether the device currently being used to open the URL is the same as the first device

To determine if the device is the same or different as the first time, a server side fingerprint hash is generated using express-fingerprint. 
This uses things like:
- user agent string
- ip address
- acceptHeaders

Each time the tracking URL is accessed, the current request's fingerprint hash is compared with the original.



Possible enhancements/features/things to investigate

- set cookie on the off chance that the email client stores cookies. Matching cookie on a future request = definite match
- add querystring to further prevent caching?
- add cluster of node workers -- one per core
- thoroughly test fingerprinting library hash function - make sure hash changes on any component change
- convert logging to winston entirely
- firefox doubles up some img requests for unknown reason. Does this happen elsewhere?
- can TLS fingerprinting be used here?
- what is the impact of using HTTPS vs HTTP for the tracker hits? Does this cause issues with mixed security origins (HTTP and HTTPS together)