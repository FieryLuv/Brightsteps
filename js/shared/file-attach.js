/**
 * Optional file attachments for enrollment docs + child profile photo.
 * Stores small data-URL payloads in LocalStorage (prototype).
 * Limits size so browser storage does not blow up.
 */
const FileAttach = {
  MAX_DOC_BYTES: 450 * 1024,       // ~450 KB per document
  MAX_PHOTO_BYTES: 280 * 1024,     // ~280 KB photo after resize
  MAX_DOCS: 4,
  PHOTO_MAX_EDGE: 480,
  /** In-form session store so huge dataURLs are not put in HTML attributes */
  _session: {},

  /**
   * Read input files → [{ name, type, size, dataUrl }]
   * Skips files that are too large (with alert).
   */
  async readFiles(fileList, opts) {
    const maxBytes = (opts && opts.maxBytes) || this.MAX_DOC_BYTES;
    const maxCount = (opts && opts.maxCount) || this.MAX_DOCS;
    const files = Array.from(fileList || []).slice(0, maxCount);
    const out = [];
    for (const file of files) {
      if (file.size > maxBytes * 1.5 && !(opts && opts.resizeImage)) {
        alert('“' + file.name + '” is too large (max about ' +
          Math.round(maxBytes / 1024) + ' KB). You can submit documents at the center instead.');
        continue;
      }
      try {
        let dataUrl;
        if (opts && opts.resizeImage && (file.type || '').indexOf('image/') === 0) {
          dataUrl = await this._resizeImageFile(file, this.PHOTO_MAX_EDGE, this.MAX_PHOTO_BYTES);
        } else {
          dataUrl = await this._readAsDataURL(file);
          if (dataUrl.length > maxBytes * 1.4) {
            alert('“' + file.name + '” is too large after reading. Submit a smaller file or bring paper copies.');
            continue;
          }
        }
        out.push({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          uploadedAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn('FileAttach read failed', e);
        alert('Could not read “' + file.name + '”.');
      }
    }
    return out;
  },

  _readAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('read failed'));
      reader.readAsDataURL(file);
    });
  },

  _resizeImageFile(file, maxEdge, maxBytes) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;
          const scale = Math.min(1, maxEdge / Math.max(w, h));
          w = Math.max(1, Math.round(w * scale));
          h = Math.max(1, Math.round(h * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          URL.revokeObjectURL(url);
          let quality = 0.82;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          while (dataUrl.length > maxBytes * 1.37 && quality > 0.45) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(dataUrl);
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('image load failed'));
      };
      img.src = url;
    });
  },

  /** UI block for optional document uploads */
  documentsFieldHtml(idPrefix, existingFiles) {
    const files = existingFiles || [];
    this._session[idPrefix + ':docs'] = files.slice();
    const list = files.length
      ? '<ul class="attach-file-list">' + files.map((f, i) =>
          '<li data-idx="' + i + '"><span class="attach-file-name">' + this._esc(f.name) +
          '</span> <span class="text-muted" style="font-size:0.78rem;">(' + this._sizeLabel(f) + ')</span></li>'
        ).join('') + '</ul>'
      : '<p class="text-muted attach-empty" style="margin:0.35rem 0 0;font-size:0.85rem;">No files attached yet.</p>';
    return `
      <div class="attach-block" data-attach="docs" id="${idPrefix}-docs-block">
        <label class="ecc-field-label">Attach documents <span class="text-muted">(optional)</span></label>
        <p class="text-muted" style="font-size:0.82rem;margin:0.2rem 0 0.5rem;">
          Birth certificate, ECCD card scan, etc. Most families submit paper copies at the center — upload only if convenient.
          Max ${this.MAX_DOCS} files, about ${Math.round(this.MAX_DOC_BYTES / 1024)} KB each.
        </p>
        <input type="file" id="${idPrefix}-doc-files" class="attach-input"
          accept=".pdf,.jpg,.jpeg,.png,.webp,image/*,application/pdf" multiple
          onchange="FileAttach.onDocsPicked('${idPrefix}')" />
        <div id="${idPrefix}-doc-list">${list}</div>
      </div>`;
  },

  /** UI block for optional profile photo */
  photoFieldHtml(idPrefix, existingPhoto) {
    const photo = existingPhoto || null;
    this._session[idPrefix + ':photo'] = photo;
    this._session[idPrefix + ':photoCleared'] = false;
    const preview = photo && photo.dataUrl
      ? `<img src="${photo.dataUrl}" alt="Profile" class="attach-photo-preview" id="${idPrefix}-photo-preview" />`
      : `<div class="attach-photo-placeholder" id="${idPrefix}-photo-preview">📷</div>`;
    return `
      <div class="attach-block attach-photo-block" data-attach="photo" id="${idPrefix}-photo-block">
        <label class="ecc-field-label">Profile picture <span class="text-muted">(optional)</span></label>
        <p class="text-muted" style="font-size:0.82rem;margin:0.2rem 0 0.5rem;">
          Can be added or changed later. Not required for enrollment.
        </p>
        <div class="attach-photo-row">
          ${preview}
          <div>
            <input type="file" id="${idPrefix}-photo-file" class="attach-input"
              accept="image/jpeg,image/png,image/webp,image/*"
              onchange="FileAttach.onPhotoPicked('${idPrefix}')" />
            <button type="button" class="btn" style="margin-top:0.4rem;background:#e8e8e8;color:#333;padding:6px 12px;font-size:0.82rem;"
              onclick="FileAttach.clearPhoto('${idPrefix}')">Remove photo</button>
          </div>
        </div>
      </div>`;
  },

  async onDocsPicked(prefix) {
    const input = document.getElementById(prefix + '-doc-files');
    if (!input || !input.files || !input.files.length) return;
    const prev = (this._session[prefix + ':docs'] || []).slice();
    const room = Math.max(0, this.MAX_DOCS - prev.length);
    if (!room) {
      alert('Maximum ' + this.MAX_DOCS + ' documents. Remove some or submit the rest at the center.');
      input.value = '';
      return;
    }
    const added = await this.readFiles(Array.from(input.files).slice(0, room), {
      maxBytes: this.MAX_DOC_BYTES,
      maxCount: room
    });
    const merged = prev.concat(added).slice(0, this.MAX_DOCS);
    this._setDocs(prefix, merged);
    input.value = '';
  },

  async onPhotoPicked(prefix) {
    const input = document.getElementById(prefix + '-photo-file');
    if (!input || !input.files || !input.files[0]) return;
    const list = await this.readFiles([input.files[0]], {
      maxBytes: this.MAX_PHOTO_BYTES,
      maxCount: 1,
      resizeImage: true
    });
    const photo = list[0] || null;
    this._setPhoto(prefix, photo);
    input.value = '';
  },

  clearPhoto(prefix) {
    this._session[prefix + ':photoCleared'] = true;
    this._setPhoto(prefix, null);
  },

  _setDocs(prefix, files) {
    this._session[prefix + ':docs'] = files || [];
    const listEl = document.getElementById(prefix + '-doc-list');
    if (!listEl) return;
    if (!files || !files.length) {
      listEl.innerHTML = '<p class="text-muted attach-empty" style="margin:0.35rem 0 0;font-size:0.85rem;">No files attached yet.</p>';
      return;
    }
    listEl.innerHTML = '<ul class="attach-file-list">' + files.map((f, i) =>
      '<li><span class="attach-file-name">' + this._esc(f.name) + '</span> ' +
      '<span class="text-muted" style="font-size:0.78rem;">(' + this._sizeLabel(f) + ')</span> ' +
      '<button type="button" class="attach-remove" onclick="FileAttach.removeDoc(\'' + prefix + '\',' + i + ')">Remove</button></li>'
    ).join('') + '</ul>';
  },

  removeDoc(prefix, index) {
    const files = (this._session[prefix + ':docs'] || []).slice();
    files.splice(index, 1);
    this._setDocs(prefix, files);
  },

  _setPhoto(prefix, photo) {
    this._session[prefix + ':photo'] = photo || null;
    this._session[prefix + ':photoCleared'] = !photo;
    const preview = document.getElementById(prefix + '-photo-preview');
    if (!preview) return;
    if (photo && photo.dataUrl) {
      if (preview.tagName === 'IMG') {
        preview.src = photo.dataUrl;
      } else {
        preview.outerHTML = '<img src="' + photo.dataUrl + '" alt="Profile" class="attach-photo-preview" id="' + prefix + '-photo-preview" />';
      }
    } else {
      if (preview.tagName === 'IMG') {
        preview.outerHTML = '<div class="attach-photo-placeholder" id="' + prefix + '-photo-preview">📷</div>';
      } else {
        preview.textContent = '📷';
        preview.className = 'attach-photo-placeholder';
      }
    }
  },

  getDocs(prefix) {
    return (this._session[prefix + ':docs'] || []).slice();
  },

  getPhoto(prefix) {
    if (this._session[prefix + ':photoCleared']) return null;
    return this._session[prefix + ':photo'] || null;
  },

  /** true if user clicked Remove photo this session */
  wasPhotoCleared(prefix) {
    return !!this._session[prefix + ':photoCleared'];
  },

  avatarHtml(child, size) {
    const s = size || 48;
    const photo = child && child.photo;
    if (photo && photo.dataUrl) {
      return '<img src="' + photo.dataUrl + '" alt="" class="child-avatar-img" style="width:' + s + 'px;height:' + s + 'px;" />';
    }
    const emoji = child && child.sex === 'Female' ? '👧' : '👦';
    return '<span class="child-avatar-emoji" style="font-size:' + Math.round(s * 0.55) + 'px;width:' + s + 'px;height:' + s + 'px;">' + emoji + '</span>';
  },

  docsListHtml(documents) {
    const files = (documents && documents.files) || [];
    if (!files.length) {
      return '<p class="text-muted" style="margin:0;font-size:0.88rem;">No digital attachments (paper copies may still be on file at the center).</p>';
    }
    return '<ul class="attach-file-list">' + files.map(f => {
      const open = f.dataUrl
        ? '<a href="' + f.dataUrl + '" target="_blank" rel="noopener">View</a>'
        : '';
      return '<li><span class="attach-file-name">' + this._esc(f.name) + '</span> ' + open + '</li>';
    }).join('') + '</ul>';
  },

  _parseJson(raw, fallback) {
    try {
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  },

  _sizeLabel(f) {
    if (f.size) return Math.round(f.size / 1024) + ' KB';
    if (f.dataUrl) return Math.round(f.dataUrl.length / 1024) + ' KB';
    return '';
  },

  _esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  _escAttr(s) {
    return this._esc(s).replace(/'/g, '&#39;');
  }
};

if (typeof window !== 'undefined') window.FileAttach = FileAttach;
