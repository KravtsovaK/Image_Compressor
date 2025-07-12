class ImageCompressor {
  constructor() {
    try {
      // Получаем и проверяем все необходимые элементы
      this.elements = {
        uploadArea: this.getRequiredElement('uploadArea'),
        fileInput: this.getRequiredElement('fileInput'),
        previewContainer: this.getRequiredElement('preview-container'),
        preview: this.getRequiredElement('preview'),
        closeBtn: this.getRequiredElement('closeBtn'),
        qualityInput: this.getRequiredElement('quality'),
        qualityValue: this.getRequiredElement('qualityValue'),
        compressBtn: this.getRequiredElement('compressBtn'),
        statusElement: this.getRequiredElement('status'),
        fileInfo: this.getRequiredElement('fileInfo'),
        originalSize: this.getRequiredElement('originalSize'),
        compressedSize: this.getRequiredElement('compressedSize'),
        savings: this.getRequiredElement('savings')
      };

      this.currentFile = null;
      this.init();
    } catch (error) {
      console.error('Ошибка инициализации ImageCompressor:', error.message);
    }
  }

  getRequiredElement(id) {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Элемент с ID "${id}" не найден в DOM`);
    }
    return element;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  updateStatus(text, type = 'info') {
    this.elements.statusElement.textContent = text;
    this.elements.statusElement.className = `status ${type}`;
  }

  resetState() {
    this.elements.uploadArea.style.display = 'block';
    this.elements.previewContainer.style.display = 'none';
    this.elements.preview.src = '';
    this.elements.fileInfo.style.display = 'none';
    this.elements.compressBtn.disabled = true;
    this.currentFile = null;
    this.updateStatus('Выберите или вставьте изображение');
  }

  setupEventListeners() {
    try {
      // Обработчик изменения качества
      this.elements.qualityInput.addEventListener('input', () => {
        this.elements.qualityValue.textContent = this.elements.qualityInput.value;
      });

      // Клик по области загрузки
      this.elements.uploadArea.addEventListener('click', () => {
        this.elements.fileInput.click();
      });

      // Изменение выбранного файла
      this.elements.fileInput.addEventListener('change', () => {
        this.handleFileSelect();
      });

      // Кнопка закрытия
      this.elements.closeBtn.addEventListener('click', () => {
        this.resetState();
      });

      // Drag and Drop
      this.elements.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.elements.uploadArea.style.background = '#e7f5ff';
      });

      this.elements.uploadArea.addEventListener('dragleave', () => {
        this.elements.uploadArea.style.background = '';
      });

      this.elements.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        this.elements.uploadArea.style.background = '';
        if (e.dataTransfer.files.length) {
          this.elements.fileInput.files = e.dataTransfer.files;
          this.handleFileSelect();
        }
      });

      // Вставка из буфера обмена
      document.addEventListener('paste', (e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            this.displayImage(blob);
            break;
          }
        }
      });

      // Кнопка сжатия
      this.elements.compressBtn.addEventListener('click', () => {
        this.compressImage();
      });

    } catch (error) {
      console.error('Ошибка при установке обработчиков событий:', error);
    }
  }

  handleFileSelect() {
    try {
      if (this.elements.fileInput.files && this.elements.fileInput.files[0]) {
        this.displayImage(this.elements.fileInput.files[0]);
      }
    } catch (error) {
      console.error('Ошибка при выборе файла:', error);
      this.updateStatus('Ошибка при выборе файла', 'error');
    }
  }

  displayImage(file) {
    try {
      if (!file.type.match('image.*')) {
        this.updateStatus('Пожалуйста, выберите файл изображения (JPEG, PNG)', 'error');
        return;
      }

      this.currentFile = file;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.elements.uploadArea.style.display = 'none';
        this.elements.preview.src = e.target.result;
        this.elements.previewContainer.style.display = 'block';
        this.elements.compressBtn.disabled = false;
        this.updateStatus(`Готово: ${file.name}`, 'success');
        
        this.elements.fileInfo.style.display = 'block';
        this.elements.originalSize.textContent = this.formatFileSize(file.size);
        this.elements.compressedSize.textContent = '-';
        this.elements.savings.textContent = '-';
      };
      reader.onerror = () => {
        this.updateStatus('Ошибка чтения файла', 'error');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Ошибка при отображении изображения:', error);
      this.updateStatus('Ошибка при обработке изображения', 'error');
    }
  }

  downloadFile(blob, filename) {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Ошибка при скачивании файла:', error);
      this.updateStatus('Ошибка при скачивании файла', 'error');
    }
  }

  compressImage() {
    try {
      if (!this.currentFile) return;

      this.updateStatus('Сжимаем изображение...', 'loading');
      this.elements.compressBtn.disabled = true;

      new Compressor(this.currentFile, {
        quality: parseFloat(this.elements.qualityInput.value),
        success: (result) => {
          const original = this.currentFile.size;
          const compressed = result.size;
          const saving = ((original - compressed) / original * 100).toFixed(1);
          
          this.elements.compressedSize.textContent = this.formatFileSize(compressed);
          this.elements.savings.textContent = saving + '%';
          
          this.downloadFile(result, `compressed_${this.currentFile.name}`);
          this.updateStatus('Изображение успешно сжато и скачано!', 'success');
          this.elements.compressBtn.disabled = false;
        },
        error: (err) => {
          this.updateStatus('Ошибка: ' + err.message, 'error');
          this.elements.compressBtn.disabled = false;
        }
      });
    } catch (error) {
      console.error('Ошибка при сжатии изображения:', error);
      this.updateStatus('Ошибка при сжатии изображения', 'error');
      this.elements.compressBtn.disabled = false;
    }
  }

  init() {
    this.resetState();
    this.setupEventListeners();
  }
}

// Запускаем приложение после полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  try {
    new ImageCompressor();
  } catch (error) {
    console.error('Не удалось инициализировать приложение:', error);
    // Отображение ошибки в интерфейсе
    const errorElement = document.createElement('div');
    errorElement.style.color = 'red';
    errorElement.style.padding = '20px';
    errorElement.textContent = 'Произошла ошибка при загрузке приложения. Пожалуйста, обновите страницу.';
    document.body.prepend(errorElement);
  }
});