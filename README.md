# Running

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
```

Run:

```
python app.py
```
