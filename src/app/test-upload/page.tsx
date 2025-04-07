"use client";

import React, { useState } from 'react';
import { Button } from "@heroui/react";
import Image from 'next/image';

// กำหนด interface แทนการใช้ any
interface UploadResult {
  success: boolean;
  message: string;
  url: string;
  publicId?: string;
  error?: string;
}

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/test-upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Upload failed');
      }

      setUploadResult(result);
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md p-4">
      <h1 className="text-2xl font-bold mb-6">Test Image Upload</h1>
      
      <div className="mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        <p className="mt-1 text-xs text-gray-500">
          Supported formats: JPG, PNG, GIF, WebP
        </p>
      </div>

      <Button
        onClick={handleUpload}
        color="primary"
        isLoading={uploading}
        disabled={!file || uploading}
        className="w-full mb-4"
      >
        {uploading ? 'Uploading...' : 'Upload Image'}
      </Button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {uploadResult && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded mb-4">
          <h2 className="text-lg font-semibold mb-2">Upload successful!</h2>
          <div className="mb-2">
            <Image 
              src={uploadResult.url} 
              alt="Uploaded image" 
              className="w-full rounded-lg shadow-md"
            />
          </div>
          <div className="text-xs break-all">
            <p className="mb-1"><strong>URL:</strong> {uploadResult.url}</p>
            <p><strong>Public ID:</strong> {uploadResult.publicId}</p>
          </div>
        </div>
      )}
    </div>
  );
}