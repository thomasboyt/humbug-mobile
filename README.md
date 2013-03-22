## Running

Get dependencies:

```
pip install -r requirements.txt
```

Enable automatic building of static assets:

```
grunt
```

Create a `config.py` file:

```python
PORT = 8080
LOG_LEVEL = 10     # 10=debug, 20=info, 30=warning
MAX_REQUESTS = 100 # maximum requests your server can have open to humbug at any time
PRODUCTION = False # true = use minified assets, false = use dev assets
```

Run:

```
python app.py
```

## Compiling Assets

Install Grunt and build dependencies:

```
sudo npm install -g grunt-cli
npm install grunt
npm install grunt-contrib --save-dev
```

(feel free to make a sandwich or brew some coffee after pasting those lines in; that last one's going to take a while)

Compile dev assets (templates & less) automatically on save with `grunt auto`.

Compile production assets (minifed js & css) with `grunt build`.
