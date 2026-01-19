#!/usr/bin/env python3
"""
Reset Qdrant Collection Script

This script deletes the existing 'rag_collection' from Qdrant.
Use this when:
1. You need to change embedding models
2. Collection has mixed dimension vectors
3. You want a fresh start
4. Starting over with new embeddings

WARNING: This will DELETE ALL indexed documents in Qdrant!
"""

import sys
from qdrant_client import QdrantClient

def reset_qdrant_collection(url: str = "http://localhost:6333", collection_name: str = "rag_collection"):
    """
    Delete the Qdrant collection to start fresh.
    
    Args:
        url: Qdrant server URL
        collection_name: Name of collection to delete
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        print(f"\n{'='*60}")
        print(f"  RESETTING QDRANT COLLECTION")
        print(f"{'='*60}")
        
        print(f"\n Connecting to Qdrant at: {url}")
        client = QdrantClient(url=url)
        
        print(f" Checking for collection: {collection_name}")
        collections = client.get_collections()
        
        collection_exists = False
        for collection in collections.collections:
            if collection.name == collection_name:
                collection_exists = True
                print(f"  Found collection: {collection_name}")
                print(f"    Vectors: {collection.points_count}")
                break
        
        if not collection_exists:
            print(f"     Collection '{collection_name}' not found (already deleted?)")
            return True
        
        print(f"\n  WARNING: This will delete ALL {collection_exists and collections.collections[0].points_count or 'all'} vectors!")
        response = input("Type 'yes' to confirm deletion: ").strip().lower()
        
        if response != "yes":
            print(" Cancelled. Collection preserved.")
            return False
        
        print(f"\n  Deleting collection: {collection_name}")
        client.delete_collection(collection_name=collection_name)
        
        print(f" Collection deleted successfully!")
        
        # Verify deletion
        collections = client.get_collections()
        for collection in collections.collections:
            if collection.name == collection_name:
                print(f" ERROR: Collection still exists!")
                return False
        
        print(f" VERIFIED: Collection no longer exists")
        print(f"\n{'='*60}")
        print(f" RESET COMPLETE")
        print(f"{'='*60}")
        print(f"\nNext steps:")
        print(f"1. Upload documents via: POST /knowledge/upload")
        print(f"2. Process documents via: POST /knowledge/process/{{document_id}}")
        print(f"3. Query documents via: POST /llm/process")
        print(f"\n")
        
        return True
        
    except Exception as e:
        print(f" ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    url = "http://localhost:6333"
    collection_name = "rag_collection"
    
    # Parse command line arguments if provided
    if len(sys.argv) > 1:
        url = sys.argv[1]
    if len(sys.argv) > 2:
        collection_name = sys.argv[2]
    
    print(f"\n Configuration:")
    print(f"   URL: {url}")
    print(f"   Collection: {collection_name}")
    
    success = reset_qdrant_collection(url, collection_name)
    sys.exit(0 if success else 1)
