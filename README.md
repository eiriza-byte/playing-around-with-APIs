# BookFinder

BookFinder is a web app for searching books by title or author. It gets its data from the Open Library API. You can filter the results, sort them, and show only books that have covers. I built it for the "Playing Around with APIs" assignment and deployed it on two web servers behind a load balancer.

## Live links

- Load balancer (Lb01): http://35.177.184.138
- Web01: http://18.170.213.153
- Web02: http://35.177.196.224
- Demo video: PASTE_VIDEO_LINK_HERE

## Why I built it

Finding a book usually means searching on several sites. BookFinder gives one simple page where you type a title or an author and see the books, their authors, their first publication year, and their covers. You can then narrow down and sort the results to find the one you want.

## Features

- Search books by title or author
- Filter the results by typing in the filter box
- Show only the books that have a cover
- Sort by title (A to Z or Z to A) or by year (newest or oldest first)
- Messages for loading, empty search, no results, and errors

## API used

- **Open Library Search API**: https://openlibrary.org/dev/docs/api/search
- **Open Library Covers API**: https://openlibrary.org/dev/docs/api/covers

Both APIs are free and do not need an API key, so there are no secrets or keys in this repository.

## Project files

- `index.html`: the structure of the page
- `style.css`: the design and layout
- `script.js`: calls the API, then handles the search, filter and sort

## Run it locally

1. Clone the repository:
   ```bash
   git clone https://github.com/eiriza-byte/playing-around-with-APIs.git
   ```
2. Open the folder in VS Code.
3. Install the **Live Server** extension.
4. Right-click `index.html` and choose **Open with Live Server**.

No installation or API key is needed.

## Deployment

### Web01 and Web02 (Nginx)

I did the same steps on both servers.

1. Connect with SSH:
   ```bash
   ssh ubuntu@SERVER_ADDRESS
   ```
2. Check that Nginx is installed (install it if it is not):
   ```bash
   nginx -v
   sudo apt update
   sudo apt install -y nginx git
   ```
3. Download the code from GitHub:
   ```bash
   git clone https://github.com/eiriza-byte/playing-around-with-APIs.git
   cd playing-around-with-APIs
   ```
4. Copy the files to the folder that Nginx serves:
   ```bash
   sudo cp index.html script.js style.css /var/www/html/
   ```
5. Test that the server answers:
   ```bash
   curl -I http://localhost
   ```
   I got `HTTP/1.1 200 OK` on both servers.

Both servers add an `X-Served-By` header to every reply (`7297-web-01` or `7297-web-02`). I use it to see which server answered.

To update the app later, I run `git pull` in the project folder on each server and copy the files to `/var/www/html/` again.

### Load balancer (Lb01, HAProxy)

1. Connect to Lb01 with SSH and install HAProxy:
   ```bash
   sudo apt update
   sudo apt install -y haproxy
   ```
2. Add this to the end of `/etc/haproxy/haproxy.cfg`:
   ```
   frontend http_front
       bind *:80
       mode http
       default_backend web_servers

   backend web_servers
       mode http
       balance roundrobin
       server web01 18.170.213.153:80 check
       server web02 35.177.196.224:80 check
   ```
3. Check the file and restart HAProxy:
   ```bash
   sudo haproxy -c -f /etc/haproxy/haproxy.cfg
   sudo systemctl restart haproxy
   ```

How it works:
- `frontend` listens for visitors on port 80.
- `backend` is the list of my two servers.
- `balance roundrobin` sends the requests to the servers in turns.
- `check` makes HAProxy test each server, and stop sending visitors to one that is down.

### Testing the load balancer

I sent several requests to the load balancer and read the `X-Served-By` header:

```powershell
1..6 | ForEach-Object { curl.exe -sI http://LB01_ADDRESS | Select-String "x-served-by" }
```

The answers alternated between `7297-web-01` and `7297-web-02`, so the traffic is shared. I also opened the app through the load balancer address and checked that search, filter and sort work.

Note: a browser may stay on one server when you refresh, because it keeps its connection open. That is why I tested with `curl`.

## Error handling

- Empty search: asks the user to type a title or an author first
- Loading: shows "loading..." while the API answers
- No results: shows "No books found. Try a different search."
- No match for the filters: shows "No books match your filters."
- API down or no internet: shows "Something went wrong. Check your internet and try again."

## Security

- No API key is used, so nothing secret is in the repo. There is a `.gitignore` that ignores `.env` and `node_modules/` in case keys are needed in the future.
- Book titles and authors are put on the page with `textContent`, not as raw HTML, so text from the API cannot run as code (this helps prevent XSS).

## Challenges and how I solved them

1. **"Cannot read properties of null" error.** My JavaScript looked for elements by `id`, but the `id` names in my HTML were missing or spelled differently. I fixed it by making every `getElementById("name")` match an `id="name"` exactly, including capital letters.
2. **A typo that only crashed sometimes.** I wrote `createElemnt` instead of `createElement`. It only crashed for books without a cover, so I did not see it at first. I now test with many different searches. I also found a wrong `=` instead of `-` in the "newest first" sort.
3. **Spaces in the API URL.** I put spaces after the commas in the `fields` list. I removed them.
4. **The server folder name.** Linux cares about capital letters. My folder on the servers was `playing-around-with-APIs`, not `Playing-Around-with-APIs`, so my copy command failed until I used the exact name from `ls`.
5. **`nano` was not installed on the server.** I installed it. Then I found that the servers already add the `X-Served-By` header themselves, so I did not need to edit the Nginx file at all.
6. **Refreshing did not show the servers switching.** The browser reuses one connection. I used `curl` several times instead, which shows the servers taking turns.

## Credits

- [Open Library](https://openlibrary.org) (Internet Archive) for the Search API and the cover images
- Nginx for the web servers
- HAProxy for the load balancer
- The Live Server extension for VS Code
