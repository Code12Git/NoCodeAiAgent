# Fix: macOS fork() Error in Worker

## Problem
```
objc[79008]: +[NSNumber initialize] may have been in progress in another thread when fork() was called.
We cannot safely call it or ignore it in the fork() child process. Crashing instead.
```

This happens on macOS because RQ worker forks processes, but Google libraries use threading which conflicts with fork().

---

## Solution Applied

### 1. Set Environment Variable FIRST
**File: `app/queue/valkey.py`**
```python
import os
os.environ["OBJC_DISABLE_INITIALIZE_FORK_SAFETY"] = "YES"  # Must be FIRST
```

**File: `app/worker/index_document.py`**
```python
import os
os.environ["OBJC_DISABLE_INITIALIZE_FORK_SAFETY"] = "YES"  # Must be FIRST
```

### 2. Use Proper Worker Startup Script
**New file: `run_worker.py`**
```python
os.environ["OBJC_DISABLE_INITIALIZE_FORK_SAFETY"] = "YES"  # FIRST
from rq import Worker
# ... then start worker
```

---

## How to Use

### Method 1: Use the Python Script (Recommended)
```bash
cd workflow-builder-backend
python run_worker.py
```

**Expected output:**
```
[WORKER] Starting RQ Worker...
[WORKER] Platform: darwin
[WORKER] OBJC_DISABLE_INITIALIZE_FORK_SAFETY: YES
[WORKER] Listening for jobs...
```

### Method 2: Use RQ Command (Alternative)
```bash
cd workflow-builder-backend
OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES python -m rq worker -c app.queue.valkey
```

---

## Complete Startup Sequence

### Terminal 1: Backend
```bash
cd workflow-builder-backend
fastapi dev app/main.py
```

### Terminal 2: Worker (Use NEW startup!)
```bash
cd workflow-builder-backend
python run_worker.py
```

**Expected output when processing:**
```
[WORKER] Starting RQ Worker...
[WORKER] Platform: darwin
[WORKER] OBJC_DISABLE_INITIALIZE_FORK_SAFETY: YES
[WORKER] Listening for jobs...

[WORKER] Starting indexing for document: 5ab692d4-ce69...
[WORKER] Provider: openai, Model: text-embedding-3-small
[WORKER] Chunks: 146
[WORKER] Creating OpenAI embedding with key: sk-proj-...
[WORKER] Indexing 146 chunks using openai/text-embedding-3-small
[WORKER] ✅ Success → {'document_id': '...', 'chunks_indexed': 146, ...}
```

### Terminal 3: Frontend
```bash
cd workflow-builder-frontend
npm run dev
```

---

## What Changed

### Before ❌
```bash
# This would crash on macOS
python -m rq worker -c app.queue.valkey
```

Result:
```
objc[79008]: +[NSNumber initialize] may have been in progress...
Work horse killed for job...
```

### After ✅
```bash
# This works on macOS
python run_worker.py
```

Result:
```
[WORKER] Starting RQ Worker...
[WORKER] Listening for jobs...
[WORKER] ✅ Success → {...}
```

---

## Files Modified

✅ **`app/queue/valkey.py`**
- Added `os.environ["OBJC_DISABLE_INITIALIZE_FORK_SAFETY"] = "YES"` at top

✅ **`app/worker/index_document.py`**
- Moved environment variable to very first line

✅ **`run_worker.py`** (NEW)
- Proper worker startup script with fork safety
- Detects macOS platform
- Sets environment variable before any imports

---

## Why This Works

1. **Fork Safety Variable** - Tells macOS Objective-C not to fork when threading is in progress
2. **Order Matters** - Must be set **BEFORE** importing any libraries
3. **Worker Script** - Ensures proper initialization order
4. **No Forking Issues** - Google libraries can now initialize safely

---

## Verification

Check that the worker is running and jobs are being processed:

```bash
# Terminal 2 should show:
[WORKER] Starting indexing for document: ...
[WORKER] Provider: openai, Model: ...
[WORKER] ✅ Success
```

---

## If You Still Get Errors

1. **Kill existing worker processes**
   ```bash
   pkill -f "rq worker"
   pkill -f "run_worker.py"
   ```

2. **Start fresh**
   ```bash
   python run_worker.py
   ```

3. **Check Redis is running**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

4. **Check logs for full error**
   - Look in Terminal 2 (Worker)
   - Look for `[WORKER]` messages

---

## Summary

✅ **Problem:** macOS fork() + threading conflict  
✅ **Solution:** Set OBJC_DISABLE_INITIALIZE_FORK_SAFETY before imports  
✅ **Implementation:** Use `run_worker.py` instead of `rq worker` command  
✅ **Result:** Worker processes jobs successfully without crashing

**Now your jobs will transition: queued → started → finished ✅**
