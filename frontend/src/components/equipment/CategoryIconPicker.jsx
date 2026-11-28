import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  CATEGORY_ICON_GROUPS,
  ALL_CATEGORY_ICONS,
  findCategoryIconMeta
} from '../../constants/categoryIcons';
import { uploadEquipmentImage } from '../../services/equipmentService';
import CategoryIcon, { isImageIcon } from '../common/CategoryIcon';

function detectMode(val) {
  if (!val || !isImageIcon(val)) return 'icons';
  const trimmed = String(val).trim();
  if (trimmed.startsWith('/uploads') || trimmed.startsWith('data:image/')) return 'upload';
  return 'url';
}

function fileToOptimizedIconDataUrl(file) {
  return new Promise((resolve, reject) => {
    const type = (file.type || '').toLowerCase();
    if (type === 'image/svg+xml' || /\.svg$/i.test(file.name || '')) {
      if (file.size > 50 * 1024) {
        return reject(new Error('SVG too large for inline storage'));
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string' && reader.result.startsWith('data:image/')) {
          resolve(reader.result);
        } else {
          reject(new Error('Invalid SVG data URL'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read SVG file'));
      reader.readAsDataURL(file);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const maxDim = 128;
        const srcW = img.naturalWidth || maxDim;
        const srcH = img.naturalHeight || maxDim;
        const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
        const width = Math.max(1, Math.round(srcW * scale));
        const height = Math.max(1, Math.round(srcH * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas 2D context unavailable');
        }
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for resizing'));
    };
    img.src = objectUrl;
  });
}

const CategoryIconPicker = ({ value = 'bi-camera', onChange }) => {
  const [mode, setMode] = useState(() => detectMode(value));
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState('ALL');
  const [urlInput, setUrlInput] = useState(() =>
    isImageIcon(value) && !String(value).trim().startsWith('data:image/') ? value : ''
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current === value) return;
    prevValueRef.current = value;

    const nextMode = detectMode(value);
    if (isImageIcon(value)) {
      const isDataUri = String(value).trim().startsWith('data:image/');
      setUrlInput(isDataUri ? '' : value);
      setMode((prev) => (prev === 'icons' || prev !== nextMode ? nextMode : prev));
    } else if (value && String(value).startsWith('bi-')) {
      setUrlInput('');
      setMode('icons');
    }
  }, [value]);

  const selectedMeta = useMemo(() => findCategoryIconMeta(value), [value]);
  const isImg = isImageIcon(value);

  const filteredIcons = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_CATEGORY_ICONS.filter((item) => {
      if (activeGroup !== 'ALL' && item.group !== activeGroup) return false;
      if (!q) return true;
      return (
        item.label.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.icon.toLowerCase().includes(q)
      );
    });
  }, [search, activeGroup]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadError('');
      try {
        const dataUrl = await fileToOptimizedIconDataUrl(file);
        if (dataUrl) {
          setUrlInput('');
          onChange(dataUrl);
          return;
        }
      } catch (_inlineErr) {
        // Fallback to server multipart upload if canvas/inline conversion fails
      }

      const res = await uploadEquipmentImage(file);
      if (res.data?.success && res.data.imageUrl) {
        setUrlInput(String(res.data.imageUrl).startsWith('data:image/') ? '' : res.data.imageUrl);
        onChange(res.data.imageUrl);
      } else {
        setUploadError('Upload succeeded but no image URL was returned.');
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to upload category picture.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleUrlChange = (e) => {
    const next = e.target.value;
    setUrlInput(next);
    if (next.trim()) {
      onChange(next.trim());
    } else {
      onChange('bi-camera-reels');
    }
  };

  const handleClearImage = () => {
    setUrlInput('');
    setUploadError('');
    onChange('bi-camera-reels');
  };

  return (
    <div className="border rounded p-2 bg-light">
      {/* Live Selected Icon / Picture Preview */}
      <div className="d-flex align-items-center justify-content-between bg-white border rounded px-2 py-2 mb-2">
        <div className="d-flex align-items-center gap-2 min-w-0">
          <div
            className="rounded bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0 border"
            style={{ width: 38, height: 38 }}
          >
            <CategoryIcon icon={value} name="Selected Category Icon" size={24} />
          </div>
          <div className="min-w-0">
            <div className="fw-semibold text-dark small text-truncate">
              {isImg
                ? 'Custom Category Picture'
                : selectedMeta
                ? selectedMeta.label
                : 'Category Icon'}
            </div>
            <div className="text-muted font-monospace text-truncate" style={{ fontSize: '0.7rem', maxWidth: '240px' }}>
              {String(value || '').startsWith('data:image/')
                ? 'Uploaded custom picture'
                : `${value || 'bi-camera'}${!isImg && selectedMeta ? ` • ${selectedMeta.group}` : ''}`}
            </div>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="btn-group btn-group-sm flex-shrink-0">
          <button
            type="button"
            className={`btn ${mode === 'icons' ? 'btn-primary' : 'btn-outline-secondary'}`}
            style={{ fontSize: '0.72rem' }}
            onClick={() => setMode('icons')}
          >
            <i className="bi bi-grid me-1"></i>Icons
          </button>
          <button
            type="button"
            className={`btn ${mode === 'url' ? 'btn-primary' : 'btn-outline-secondary'}`}
            style={{ fontSize: '0.72rem' }}
            onClick={() => setMode('url')}
          >
            <i className="bi bi-link-45deg me-1"></i>URL
          </button>
          <button
            type="button"
            className={`btn ${mode === 'upload' ? 'btn-primary' : 'btn-outline-secondary'}`}
            style={{ fontSize: '0.72rem' }}
            onClick={() => setMode('upload')}
          >
            <i className="bi bi-upload me-1"></i>Upload
          </button>
        </div>
      </div>

      {/* MODE 1: Industry Icons */}
      {mode === 'icons' && (
        <>
          <div className="input-group input-group-sm mb-2">
            <span className="input-group-text bg-white">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search icons (e.g. stand, light, lens, bag, mic, battery)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setSearch('')}
                title="Clear icon search"
              >
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>

          <div className="d-flex align-items-center gap-1 overflow-auto pb-2 mb-2" style={{ whiteSpace: 'nowrap' }}>
            <button
              type="button"
              className={`btn btn-xs rounded-pill px-2 py-1 flex-shrink-0 ${
                activeGroup === 'ALL' ? 'btn-dark text-white fw-semibold' : 'btn-white bg-white border text-secondary'
              }`}
              style={{ fontSize: '0.7rem' }}
              onClick={() => setActiveGroup('ALL')}
            >
              All ({ALL_CATEGORY_ICONS.length})
            </button>
            {CATEGORY_ICON_GROUPS.map((g) => (
              <button
                key={g.group}
                type="button"
                className={`btn btn-xs rounded-pill px-2 py-1 flex-shrink-0 ${
                  activeGroup === g.group ? 'btn-primary text-white fw-semibold' : 'btn-white bg-white border text-secondary'
                }`}
                style={{ fontSize: '0.7rem' }}
                onClick={() => setActiveGroup(g.group)}
              >
                {g.group}
              </button>
            ))}
          </div>

          <div
            className="bg-white border rounded p-2"
            style={{ maxHeight: '220px', overflowY: 'auto' }}
          >
            {filteredIcons.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                No icons match &quot;{search}&quot;. Try another keyword like camera, stand, light, or bag.
              </div>
            ) : (
              <div className="row g-2">
                {filteredIcons.map((item) => {
                  const isSelected = value === item.icon;
                  return (
                    <div key={item.icon} className="col-4 col-sm-3">
                      <button
                        type="button"
                        onClick={() => onChange(item.icon)}
                        title={`${item.label} (${item.group})`}
                        className={`btn btn-sm w-100 d-flex flex-column align-items-center justify-content-center py-2 px-1 ${
                          isSelected
                            ? 'btn-primary text-white shadow-xs'
                            : 'btn-light border text-dark'
                        }`}
                        style={{ minHeight: '58px' }}
                      >
                        <i className={`bi ${item.icon} fs-5 mb-1`}></i>
                        <span
                          className="text-truncate w-100 text-center"
                          style={{ fontSize: '0.65rem', lineHeight: 1.15 }}
                        >
                          {item.label}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* MODE 2: Image URL */}
      {mode === 'url' && (
        <div className="bg-white border rounded p-3">
          <label className="form-label small fw-semibold text-secondary mb-1">
            Paste Category Icon Image URL
          </label>
          <div className="input-group input-group-sm mb-2">
            <span className="input-group-text bg-light">
              <i className="bi bi-link-45deg"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="https://example.com/icon.png"
              value={urlInput}
              onChange={handleUrlChange}
            />
            {urlInput && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleClearImage}
                title="Reset to default icon"
              >
                Clear
              </button>
            )}
          </div>
          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
            Supports direct image links (.png, .jpg, .webp, .svg, .gif). The preview above updates automatically.
          </div>
        </div>
      )}

      {/* MODE 3: Upload Picture */}
      {mode === 'upload' && (
        <div className="bg-white border rounded p-3">
          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
            <label className="btn btn-sm btn-outline-primary mb-0 cursor-pointer">
              <i className="bi bi-cloud-arrow-up me-1"></i>
              {uploading ? 'Uploading...' : 'Choose Picture File'}
              <input
                type="file"
                accept="image/*"
                className="d-none"
                disabled={uploading}
                onChange={handleFileUpload}
              />
            </label>
            {isImg && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={handleClearImage}
              >
                Remove Picture
              </button>
            )}
          </div>
          {uploadError && (
            <div className="alert alert-danger py-1 px-2 small mb-2">
              {uploadError}
            </div>
          )}
          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
            Upload a PNG, JPG, WEBP, GIF, or SVG icon/photo (max 10MB) to use as this category icon.
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryIconPicker;
