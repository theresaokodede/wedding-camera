"use strict";

const GOOGLE_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyfQldB_MEOO9dsEiRAr41q9LrYmOaF_Pp70-6YMMObWKfR-f08-Il94fxgZd5rRqrReQ/exec";

const SETTINGS = {
  eventName: "Theresa & Precious",
  maximumFileSizeMB: 25,
  maximumFilesPerUpload: 20,
  maximumConcurrentUploads: 2,
  galleryRefreshTime: 60000,
  uploadConfirmationTimeout: 90000,
  uploadStatusPollInterval: 900,
  imageCompressionThresholdMB: 1.2,
  imageMaximumDimension: 1920,
  imageQuality: 0.82
};

const state = {
  selectedFiles: [],
  selectedFileUrls: [],
  galleryTimer: null,
  galleryRequestActive: false,
  toastTimer: null,
  qrAttempts: 0,
  uploading: false
};

const elements = {};

document.addEventListener("DOMContentLoaded", startWebsite);

function startWebsite() {
  collectElements();
  connectButtons();
  showCorrectPage();
  createQrCode();
  checkHeroImage();

  window.addEventListener("hashchange", showCorrectPage);
  document.addEventListener("keydown", handleEscapeKey);
}

function collectElements() {
  const ids = [
    "homeView",
    "galleryView",
    "openShareSheet",
    "openGallery",
    "closeGallery",
    "refreshGallery",
    "galleryLoading",
    "galleryGrid",
    "emptyGallery",
    "shareFromEmptyGallery",
    "galleryShareButton",
    "backdrop",
    "shareSheet",
    "closeShareSheet",
    "takePhotoInput",
    "uploadPhotoInput",
    "recordVideoInput",
    "uploadVideoInput",
    "uploadDialog",
    "closeUploadDialog",
    "previewArea",
    "selectedFileDetails",
    "guestName",
    "uploadProgress",
    "progressBar",
    "progressText",
    "uploadActions",
    "chooseAnotherFile",
    "confirmUpload",
    "successDialog",
    "successTitle",
    "successHome",
    "successGallery",
    "memoryViewer",
    "closeMemoryViewer",
    "memoryViewerMedia",
    "memoryViewerGuest",
    "memoryViewerDate",
    "downloadMemory",
    "openQrCode",
    "qrDialog",
    "closeQrDialog",
    "qrCode",
    "qrWebsiteAddress",
    "shareWebsite",
    "toast",
    "heroImage"
  ];

  ids.forEach((id) => {
    const element = document.getElementById(id);

    if (!element) {
      throw new Error(`Missing required page element: ${id}`);
    }

    elements[id] = element;
  });

  elements.shareOptions = Array.from(
    document.querySelectorAll(".share-option[data-input]")
  );

  elements.fileInputs = [
    elements.takePhotoInput,
    elements.uploadPhotoInput,
    elements.recordVideoInput,
    elements.uploadVideoInput
  ];
}

function connectButtons() {
  elements.openShareSheet.addEventListener(
    "click",
    openShareSheet
  );

  elements.galleryShareButton.addEventListener(
    "click",
    openShareSheet
  );

  elements.shareFromEmptyGallery.addEventListener(
    "click",
    openShareSheet
  );

  elements.closeShareSheet.addEventListener(
    "click",
    closeShareSheet
  );

  elements.backdrop.addEventListener(
    "click",
    closeShareSheet
  );

  elements.openGallery.addEventListener(
    "click",
    openGalleryPage
  );

  elements.closeGallery.addEventListener(
    "click",
    openHomePage
  );

  elements.refreshGallery.addEventListener(
    "click",
    () => loadGallery(true)
  );

  elements.shareOptions.forEach((button) => {
    button.addEventListener("click", () => {
      const input =
        document.getElementById(
          button.dataset.input
        );

      closeShareSheet();

      window.setTimeout(() => {
        input.click();
      }, 80);
    });
  });

  elements.fileInputs.forEach((input) => {
    input.addEventListener(
      "change",
      handleSelectedFiles
    );
  });

  elements.closeUploadDialog.addEventListener(
    "click",
    closeUploadDialog
  );

  elements.chooseAnotherFile.addEventListener(
    "click",
    chooseAnotherFile
  );

  elements.confirmUpload.addEventListener(
    "click",
    uploadMemories
  );

  elements.successHome.addEventListener(
    "click",
    () => {
      closeSuccessDialog();
      openHomePage();
    }
  );

  elements.successGallery.addEventListener(
    "click",
    () => {
      closeSuccessDialog();
      openGalleryPage();
    }
  );

  elements.closeMemoryViewer.addEventListener(
    "click",
    closeMemoryViewer
  );

  elements.memoryViewer.addEventListener(
    "click",
    (event) => {
      if (
        event.target ===
        elements.memoryViewer
      ) {
        closeMemoryViewer();
      }
    }
  );

  elements.openQrCode.addEventListener(
    "click",
    openQrDialog
  );

  elements.closeQrDialog.addEventListener(
    "click",
    closeQrDialog
  );

  elements.shareWebsite.addEventListener(
    "click",
    shareWebsiteLink
  );

  elements.uploadDialog.addEventListener(
    "click",
    (event) => {
      if (
        event.target ===
          elements.uploadDialog &&
        !state.uploading
      ) {
        closeUploadDialog();
      }
    }
  );

  elements.successDialog.addEventListener(
    "click",
    (event) => {
      if (
        event.target ===
        elements.successDialog
      ) {
        closeSuccessDialog();
      }
    }
  );

  elements.qrDialog.addEventListener(
    "click",
    (event) => {
      if (
        event.target ===
        elements.qrDialog
      ) {
        closeQrDialog();
      }
    }
  );
}

function showCorrectPage() {
  if (
    window.location.hash ===
    "#gallery"
  ) {
    showGalleryView();
  } else {
    showHomeView();
  }
}

function openGalleryPage() {
  if (
    window.location.hash !==
    "#gallery"
  ) {
    window.location.hash =
      "gallery";
  } else {
    showGalleryView();
  }
}

function openHomePage() {
  if (window.location.hash) {
    history.pushState(
      null,
      "",
      window.location.pathname +
        window.location.search
    );
  }

  showHomeView();
}

function showGalleryView() {
  elements.homeView.hidden = true;
  elements.galleryView.hidden = false;

  window.scrollTo({
    top: 0,
    behavior: "auto"
  });

  loadGallery(false);
  beginGalleryRefresh();
}

function showHomeView() {
  stopGalleryRefresh();

  elements.galleryView.hidden = true;
  elements.homeView.hidden = false;

  window.scrollTo({
    top: 0,
    behavior: "auto"
  });
}

function openShareSheet() {
  elements.backdrop.hidden = false;
  elements.shareSheet.hidden = false;

  requestAnimationFrame(() => {
    elements.backdrop.classList.add(
      "visible"
    );

    elements.shareSheet.classList.add(
      "visible"
    );

    syncBodyModalState();
  });
}

function closeShareSheet() {
  elements.backdrop.classList.remove(
    "visible"
  );

  elements.shareSheet.classList.remove(
    "visible"
  );

  window.setTimeout(() => {
    elements.backdrop.hidden = true;
    elements.shareSheet.hidden = true;
    syncBodyModalState();
  }, 280);
}

function handleSelectedFiles(event) {
  const files = Array.from(
    event.target.files || []
  );

  event.target.value = "";

  if (!files.length) {
    return;
  }

  if (
    files.length >
    SETTINGS.maximumFilesPerUpload
  ) {
    showToast(
      `Please select no more than ${SETTINGS.maximumFilesPerUpload} files at once.`
    );

    return;
  }

  const validFiles = [];
  const rejectedFiles = [];

  files.forEach((file) => {
    if (validateFile(file)) {
      rejectedFiles.push(file.name);
    } else {
      validFiles.push(file);
    }
  });

  if (!validFiles.length) {
    showToast(
      `None of the selected files could be added. Use photos or videos smaller than ${SETTINGS.maximumFileSizeMB} MB each.`
    );

    return;
  }

  clearSelectedFiles();

  state.selectedFiles = validFiles;

  state.selectedFileUrls =
    validFiles.map((file) =>
      URL.createObjectURL(file)
    );

  showFilesPreview();
  openUploadDialog();

  if (rejectedFiles.length) {
    showToast(
      `${rejectedFiles.length} file(s) were skipped because they were unsupported or too large.`
    );
  }
}

function validateFile(file) {
  const supported =
    file.type.startsWith("image/") ||
    file.type.startsWith("video/");

  if (!supported) {
    return "Unsupported file";
  }

  const maximumBytes =
    SETTINGS.maximumFileSizeMB *
    1024 *
    1024;

  return file.size > maximumBytes
    ? "File too large"
    : "";
}

function showFilesPreview() {
  elements.previewArea.replaceChildren();

  const previewGrid =
    document.createElement("div");

  previewGrid.className =
    "multi-preview-grid";

  state.selectedFiles.forEach(
    (file, index) => {
      const previewItem =
        document.createElement("div");

      previewItem.className =
        "multi-preview-item";

      if (
        file.type.startsWith("image/")
      ) {
        const image =
          document.createElement("img");

        image.src =
          state.selectedFileUrls[index];

        image.alt =
          "Selected wedding memory";

        previewItem.appendChild(image);
      } else {
        const video =
          document.createElement("video");

        video.src =
          state.selectedFileUrls[index];

        video.controls = true;
        video.playsInline = true;
        video.preload = "metadata";

        previewItem.appendChild(video);
      }

      const number =
        document.createElement("span");

      number.className =
        "preview-number";

      number.textContent =
        String(index + 1);

      previewItem.appendChild(number);
      previewGrid.appendChild(
        previewItem
      );
    }
  );

  elements.previewArea.appendChild(
    previewGrid
  );

  const totalSize =
    state.selectedFiles.reduce(
      (total, file) =>
        total + file.size,
      0
    );

  const fileWord =
    state.selectedFiles.length === 1
      ? "file"
      : "files";

  elements.selectedFileDetails.textContent =
    `${state.selectedFiles.length} ${fileWord} selected · ${formatFileSize(totalSize)}`;

  elements.confirmUpload.textContent =
    state.selectedFiles.length === 1
      ? "Add to the Album"
      : `Add ${state.selectedFiles.length} Memories`;
}

function openUploadDialog() {
  resetUploadProgress();

  elements.uploadDialog.hidden =
    false;

  syncBodyModalState();
}

function closeUploadDialog() {
  if (state.uploading) {
    return;
  }

  elements.uploadDialog.hidden = true;
  elements.guestName.value = "";

  clearSelectedFiles();
  resetUploadProgress();
  syncBodyModalState();
}

function chooseAnotherFile() {
  if (state.uploading) {
    return;
  }

  elements.uploadDialog.hidden = true;

  clearSelectedFiles();
  resetUploadProgress();
  syncBodyModalState();
  openShareSheet();
}

async function uploadMemories() {
  if (state.uploading) {
    return;
  }

  if (!state.selectedFiles.length) {
    showToast(
      "Please choose at least one photo or video."
    );

    return;
  }

  if (!isValidWebAppUrl()) {
    showToast(
      "The Google Drive upload address has not been added correctly."
    );

    return;
  }

  state.uploading = true;
  setUploadingState(true);

  const guestName =
    elements.guestName.value.trim();

  const files = [
    ...state.selectedFiles
  ];

  const results =
    new Array(files.length);

  const workerCount =
    Math.min(
      SETTINGS.maximumConcurrentUploads,
      files.length
    );

  let nextIndex = 0;
  let completed = 0;

  async function uploadWorker() {
    while (
      nextIndex < files.length
    ) {
      const index = nextIndex;

      nextIndex += 1;

      const file = files[index];

      updateProgress(
        Math.round(
          (completed / files.length) *
            100
        ),
        `Preparing ${index + 1} of ${files.length}: ${file.name}`
      );

      try {
        results[index] =
          await uploadOneFile(
            file,
            guestName,
            index,
            files.length
          );
      } catch (error) {
        console.error(
          "Upload failed:",
          file.name,
          error
        );

        results[index] = {
          success: false,
          fileName: file.name,
          message:
            error.message ||
            "Upload failed"
        };
      }

      completed += 1;

      updateProgress(
        Math.round(
          (completed / files.length) *
            100
        ),
        completed === files.length
          ? "Finishing your upload..."
          : `${completed} of ${files.length} memories uploaded`
      );
    }
  }

  try {
    await Promise.all(
      Array.from(
        {
          length: workerCount
        },
        () => uploadWorker()
      )
    );

    const successfulUploads =
      results.filter(
        (result) =>
          result?.success
      );

    const failedUploads =
      results.filter(
        (result) =>
          !result?.success
      );

    if (!successfulUploads.length) {
      throw new Error(
        failedUploads[0]?.message ||
          "The files could not be uploaded. Please check the connection and try again."
      );
    }

    updateProgress(
      100,
      "Your memories have been added to the album."
    );

    await wait(350);

    elements.uploadDialog.hidden =
      true;

    clearSelectedFiles();
    resetUploadProgress();

    elements.successTitle.textContent =
      successfulUploads.length === 1
        ? "Thank you for sharing this moment"
        : `Thank you for sharing ${successfulUploads.length} memories`;

    elements.successDialog.hidden =
      false;

    syncBodyModalState();

    if (failedUploads.length) {
      showToast(
        `${successfulUploads.length} file(s) uploaded. ${failedUploads.length} file(s) could not be uploaded.`
      );
    }
  } catch (error) {
    console.error(error);

    showToast(
      error.message ||
        "The upload did not complete. Please try again."
    );
  } finally {
    state.uploading = false;
    setUploadingState(false);
  }
}

async function uploadOneFile(
  file,
  guestName,
  index,
  totalFiles
) {
  const preparedFile =
    file.type.startsWith("image/")
      ? await compressImageForUpload(
          file
        )
      : file;

  updateProgress(
    Math.max(
      3,
      Math.round(
        (index / totalFiles) *
          100
      )
    ),
    preparedFile !== file
      ? `Optimising ${index + 1} of ${totalFiles}: ${file.name}`
      : `Preparing ${index + 1} of ${totalFiles}: ${file.name}`
  );

  const requestId =
    createRequestId();

  const uploadData = {
    action: "upload",
    requestId,
    eventName:
      SETTINGS.eventName,
    guestName,
    fileName:
      createSafeFileName(
        preparedFile.name ||
          file.name
      ),
    mimeType:
      preparedFile.type ||
      file.type,
    base64:
      await convertFileToBase64(
        preparedFile
      ),
    uploadedAt:
      new Date().toISOString()
  };

  await fetch(
    GOOGLE_APPS_SCRIPT_URL,
    {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type":
          "text/plain;charset=utf-8"
      },
      body:
        JSON.stringify(uploadData)
    }
  );

  const confirmation =
    await waitForUploadConfirmation(
      requestId
    );

  if (!confirmation.success) {
    throw new Error(
      confirmation.message ||
        "Google Drive did not save the file."
    );
  }

  return confirmation;
}

async function waitForUploadConfirmation(
  requestId
) {
  const startedAt = Date.now();

  while (
    Date.now() - startedAt <
    SETTINGS.uploadConfirmationTimeout
  ) {
    try {
      const result =
        await requestJsonp({
          action: "status",
          requestId,
          t: Date.now()
        });

      if (
        result.status ===
        "success"
      ) {
        return {
          success: true,
          file:
            result.file || null,
          message:
            result.message ||
            "Upload complete"
        };
      }

      if (
        result.status ===
        "error"
      ) {
        return {
          success: false,
          message:
            result.message ||
            "The upload failed."
        };
      }
    } catch (error) {
      console.warn(
        "Upload status check failed. Retrying...",
        error
      );
    }

    await wait(
      SETTINGS.uploadStatusPollInterval
    );
  }

  throw new Error(
    "The upload took too long to confirm. Check Google Drive before trying again."
  );
}

function setUploadingState(
  isUploading
) {
  elements.uploadProgress.hidden =
    !isUploading;

  elements.uploadActions.hidden =
    isUploading;

  elements.confirmUpload.disabled =
    isUploading;

  elements.closeUploadDialog.disabled =
    isUploading;

  if (isUploading) {
    updateProgress(
      2,
      "Preparing your memories..."
    );
  }
}

function resetUploadProgress() {
  elements.uploadProgress.hidden =
    true;

  elements.uploadActions.hidden =
    false;

  elements.confirmUpload.disabled =
    false;

  elements.closeUploadDialog.disabled =
    false;

  elements.progressBar.style.width =
    "0%";

  elements.progressText.textContent =
    "Preparing your memories...";
}

async function loadGallery(
  showRefreshMessage
) {
  if (
    state.galleryRequestActive ||
    !isValidWebAppUrl()
  ) {
    return;
  }

  state.galleryRequestActive = true;

  elements.emptyGallery.hidden = true;
  elements.galleryLoading.hidden = false;

  if (showRefreshMessage) {
    showToast(
      "Refreshing the wedding memories..."
    );
  }

  try {
    const result =
      await requestJsonp({
        action: "list",
        t: Date.now()
      });

    if (
      !result.success ||
      !Array.isArray(result.files)
    ) {
      throw new Error(
        result.message ||
          "The gallery returned an invalid response."
      );
    }

    renderGallery(result.files);
  } catch (error) {
    console.error(error);

    elements.galleryGrid.replaceChildren();

    elements.emptyGallery.hidden =
      false;

    showToast(
      error.message ||
        "The gallery could not be loaded."
    );
  } finally {
    elements.galleryLoading.hidden =
      true;

    state.galleryRequestActive =
      false;
  }
}

function requestJsonp(
  parameters,
  timeoutMs = 15000
) {
  return new Promise(
    (resolve, reject) => {
      const callbackName =
        `weddingCallback_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}`;

      const script =
        document.createElement(
          "script"
        );

      const timeout =
        window.setTimeout(() => {
          cleanup();

          reject(
            new Error(
              "The request took too long to complete."
            )
          );
        }, timeoutMs);

      function cleanup() {
        window.clearTimeout(
          timeout
        );

        if (script.parentNode) {
          script.parentNode.removeChild(
            script
          );
        }

        delete window[callbackName];
      }

      window[callbackName] =
        (result) => {
          cleanup();
          resolve(result || {});
        };

      const search =
        new URLSearchParams({
          ...parameters,
          callback: callbackName
        });

      script.src =
        `${GOOGLE_APPS_SCRIPT_URL}?${search.toString()}`;

      script.onerror = () => {
        cleanup();

        reject(
          new Error(
            "The website could not connect to Google Drive."
          )
        );
      };

      document.body.appendChild(
        script
      );
    }
  );
}

function renderGallery(memories) {
  elements.galleryGrid.replaceChildren();

  if (!memories.length) {
    elements.emptyGallery.hidden =
      false;

    return;
  }

  elements.emptyGallery.hidden =
    true;

  memories.forEach((memory) => {
    const card =
      document.createElement(
        "button"
      );

    const mediaBox =
      document.createElement(
        "div"
      );

    const thumbnail =
      document.createElement(
        "img"
      );

    const guestName =
      memory.guestName ||
      "A Wedding Guest";

    const isVideo =
      String(
        memory.mimeType || ""
      ).startsWith("video/");

    card.type = "button";
    card.className =
      "memory-card";

    card.setAttribute(
      "aria-label",
      isVideo
        ? `Open video shared by ${guestName}`
        : `Open photo shared by ${guestName}`
    );

    mediaBox.className =
      "memory-media";

    thumbnail.src =
      memory.thumbnailUrl ||
      memory.url ||
      "";

    thumbnail.alt =
      isVideo
        ? `Wedding video shared by ${guestName}`
        : `Wedding photo shared by ${guestName}`;

    thumbnail.loading =
      "lazy";

    thumbnail.decoding =
      "async";

    mediaBox.appendChild(
      thumbnail
    );

    if (isVideo) {
      const videoBadge =
        document.createElement(
          "span"
        );

      videoBadge.className =
        "video-badge";

      videoBadge.setAttribute(
        "aria-hidden",
        "true"
      );

      videoBadge.textContent =
        "▶";

      mediaBox.appendChild(
        videoBadge
      );
    }

    card.appendChild(mediaBox);

    card.addEventListener(
      "click",
      () =>
        openMemoryViewer(
          memory
        )
    );

    elements.galleryGrid.appendChild(
      card
    );
  });
}

function openMemoryViewer(memory) {
  elements.memoryViewerMedia.replaceChildren();

  const isVideo =
    String(
      memory.mimeType || ""
    ).startsWith("video/");

  if (isVideo) {
    const frame =
      document.createElement(
        "iframe"
      );

    frame.src =
      memory.embedUrl ||
      memory.driveUrl ||
      "";

    frame.title =
      `Wedding video shared by ${memory.guestName || "a guest"}`;

    frame.allow =
      "autoplay; fullscreen";

    frame.loading =
      "eager";

    frame.setAttribute(
      "allowfullscreen",
      ""
    );

    elements.memoryViewerMedia.appendChild(
      frame
    );
  } else {
    const image =
      document.createElement(
        "img"
      );

    let fullImageUrl =
      memory.thumbnailUrl ||
      memory.url ||
      "";

    fullImageUrl =
      fullImageUrl.replace(
        /sz=w\d+/i,
        "sz=w2400"
      );

    image.src = fullImageUrl;

    image.alt =
      `Wedding memory shared by ${memory.guestName || "a guest"}`;

    elements.memoryViewerMedia.appendChild(
      image
    );
  }

  elements.memoryViewerGuest.textContent =
    memory.guestName ||
    "A Wedding Guest";

  elements.memoryViewerDate.textContent =
    formatMemoryDate(
      memory.createdAt
    );

  elements.downloadMemory.href =
    memory.downloadUrl ||
    memory.driveUrl ||
    memory.url ||
    "#";

  elements.downloadMemory.textContent =
    isVideo
      ? "Download Video"
      : "Download Photo";

  if (memory.name) {
    elements.downloadMemory.setAttribute(
      "download",
      memory.name
    );
  } else {
    elements.downloadMemory.removeAttribute(
      "download"
    );
  }

  elements.memoryViewer.hidden =
    false;

  syncBodyModalState();
}

function closeMemoryViewer() {
  elements.memoryViewer.hidden =
    true;

  elements.memoryViewerMedia.replaceChildren();

  elements.downloadMemory.href =
    "#";

  syncBodyModalState();
}

function closeSuccessDialog() {
  elements.successDialog.hidden =
    true;

  elements.guestName.value =
    "";

  syncBodyModalState();
}

function openQrDialog() {
  elements.qrDialog.hidden =
    false;

  syncBodyModalState();
}

function closeQrDialog() {
  elements.qrDialog.hidden =
    true;

  syncBodyModalState();
}

function createQrCode() {
  const websiteUrl =
    getWebsiteUrl();

  elements.qrWebsiteAddress.textContent =
    websiteUrl;

  if (
    typeof QRCode ===
    "undefined"
  ) {
    state.qrAttempts += 1;

    if (
      state.qrAttempts < 20
    ) {
      window.setTimeout(
        createQrCode,
        300
      );
    }

    return;
  }

  state.qrAttempts = 0;

  elements.qrCode.replaceChildren();

  new QRCode(
    elements.qrCode,
    {
      text: websiteUrl,
      width: 260,
      height: 260,
      colorDark: "#51132e",
      colorLight: "#ffffff",
      correctLevel:
        QRCode.CorrectLevel.H
    }
  );
}

async function shareWebsiteLink() {
  const websiteUrl =
    getWebsiteUrl();

  try {
    if (navigator.share) {
      await navigator.share({
        title:
          "Theresa & Precious Wedding Memories",

        text:
          "Share and view memories from Theresa and Precious' wedding.",

        url: websiteUrl
      });

      return;
    }

    await navigator.clipboard.writeText(
      websiteUrl
    );

    showToast(
      "The wedding website link has been copied."
    );
  } catch (error) {
    if (
      error.name !==
      "AbortError"
    ) {
      showToast(
        `Copy this address: ${websiteUrl}`
      );
    }
  }
}

function getWebsiteUrl() {
  return window.location.href.split(
    "#"
  )[0];
}

function checkHeroImage() {
  elements.heroImage.addEventListener(
    "error",
    () => {
      elements.heroImage.alt =
        "Add the approved wedding photo inside assets/images and name it hero.jpg";

      showToast(
        "The hero image is missing."
      );
    }
  );
}

function handleEscapeKey(event) {
  if (
    event.key !== "Escape"
  ) {
    return;
  }

  if (
    !elements.memoryViewer.hidden
  ) {
    closeMemoryViewer();
  } else if (
    !elements.qrDialog.hidden
  ) {
    closeQrDialog();
  } else if (
    !elements.successDialog.hidden
  ) {
    closeSuccessDialog();
  } else if (
    !elements.uploadDialog.hidden &&
    !state.uploading
  ) {
    closeUploadDialog();
  } else if (
    !elements.shareSheet.hidden
  ) {
    closeShareSheet();
  }
}

function syncBodyModalState() {
  const modalIsOpen =
    !elements.shareSheet.hidden ||
    !elements.uploadDialog.hidden ||
    !elements.successDialog.hidden ||
    !elements.memoryViewer.hidden ||
    !elements.qrDialog.hidden;

  document.body.classList.toggle(
    "modal-open",
    modalIsOpen
  );
}

function beginGalleryRefresh() {
  stopGalleryRefresh();

  state.galleryTimer =
    window.setInterval(
      () => {
        if (
          !elements.galleryView.hidden
        ) {
          loadGallery(false);
        }
      },
      SETTINGS.galleryRefreshTime
    );
}

function stopGalleryRefresh() {
  if (!state.galleryTimer) {
    return;
  }

  window.clearInterval(
    state.galleryTimer
  );

  state.galleryTimer = null;
}

function clearSelectedFiles() {
  state.selectedFileUrls.forEach(
    (url) =>
      URL.revokeObjectURL(url)
  );

  state.selectedFiles = [];
  state.selectedFileUrls = [];

  elements.previewArea.replaceChildren();

  elements.selectedFileDetails.textContent =
    "";

  elements.confirmUpload.textContent =
    "Add to the Album";
}

function compressImageForUpload(file) {
  const thresholdBytes =
    SETTINGS.imageCompressionThresholdMB *
    1024 *
    1024;

  const cannotCompress =
    !file.type.startsWith("image/") ||
    file.type === "image/gif" ||
    file.type === "image/svg+xml" ||
    file.size < thresholdBytes;

  if (cannotCompress) {
    return Promise.resolve(file);
  }

  return new Promise((resolve) => {
    const image =
      new Image();

    const imageUrl =
      URL.createObjectURL(file);

    function finish(result) {
      URL.revokeObjectURL(
        imageUrl
      );

      resolve(result);
    }

    image.onload = () => {
      const largestDimension =
        Math.max(
          image.naturalWidth,
          image.naturalHeight
        );

      const scale =
        Math.min(
          1,
          SETTINGS.imageMaximumDimension /
            largestDimension
        );

      const width =
        Math.max(
          1,
          Math.round(
            image.naturalWidth *
              scale
          )
        );

      const height =
        Math.max(
          1,
          Math.round(
            image.naturalHeight *
              scale
          )
        );

      const canvas =
        document.createElement(
          "canvas"
        );

      canvas.width = width;
      canvas.height = height;

      const context =
        canvas.getContext("2d");

      if (!context) {
        finish(file);
        return;
      }

      context.fillStyle =
        "#ffffff";

      context.fillRect(
        0,
        0,
        width,
        height
      );

      context.imageSmoothingEnabled =
        true;

      context.imageSmoothingQuality =
        "high";

      context.drawImage(
        image,
        0,
        0,
        width,
        height
      );

      canvas.toBlob(
        (blob) => {
          if (
            !blob ||
            blob.size >= file.size
          ) {
            finish(file);
            return;
          }

          finish(
            new File(
              [blob],
              createCompressedFileName(
                file.name
              ),
              {
                type:
                  "image/jpeg",

                lastModified:
                  Date.now()
              }
            )
          );
        },
        "image/jpeg",
        SETTINGS.imageQuality
      );
    };

    image.onerror = () =>
      finish(file);

    image.src = imageUrl;
  });
}

function createCompressedFileName(
  originalName
) {
  return `${originalName.replace(
    /\.[^/.]+$/,
    ""
  )}-optimised.jpg`;
}

function convertFileToBase64(file) {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload = () => {
        const result =
          String(
            reader.result || ""
          );

        const commaIndex =
          result.indexOf(",");

        resolve(
          commaIndex >= 0
            ? result.slice(
                commaIndex + 1
              )
            : result
        );
      };

      reader.onerror = () => {
        reject(
          new Error(
            "The selected file could not be read."
          )
        );
      };

      reader.readAsDataURL(file);
    }
  );
}

function createRequestId() {
  if (
    window.crypto &&
    typeof window.crypto.randomUUID ===
      "function"
  ) {
    return window.crypto.randomUUID();
  }

  return `upload-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function createSafeFileName(
  originalName
) {
  const time =
    new Date()
      .toISOString()
      .replace(/[:.]/g, "-");

  const cleanName =
    String(originalName).replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );

  return `${time}_${cleanName}`;
}

function updateProgress(
  percent,
  message
) {
  const safePercent =
    Math.min(
      100,
      Math.max(
        0,
        Number(percent) || 0
      )
    );

  elements.progressBar.style.width =
    `${safePercent}%`;

  elements.progressText.textContent =
    message;
}

function formatFileSize(bytes) {
  if (
    bytes <
    1024 * 1024
  ) {
    return `${Math.max(
      1,
      Math.round(bytes / 1024)
    )} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function formatMemoryDate(
  dateValue
) {
  if (!dateValue) {
    return "25 July 2026";
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "25 July 2026";
  }

  return new Intl.DateTimeFormat(
    "en-NG",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }
  ).format(date);
}

function isValidWebAppUrl() {
  return (
    GOOGLE_APPS_SCRIPT_URL.startsWith(
      "https://script.google.com/"
    ) &&
    GOOGLE_APPS_SCRIPT_URL.endsWith(
      "/exec"
    )
  );
}

function showToast(message) {
  window.clearTimeout(
    state.toastTimer
  );

  elements.toast.textContent =
    message;

  elements.toast.hidden =
    false;

  state.toastTimer =
    window.setTimeout(() => {
      elements.toast.hidden =
        true;
    }, 4200);
}

function wait(milliseconds) {
  return new Promise((resolve) =>
    window.setTimeout(
      resolve,
      milliseconds
    )
  );
}