"use strict";

const GOOGLE_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwL3qk1XIilfLCuCt-6W2Bt2Ps4vKDG9ko3SDE1rtbLP9rReoEPf_A8iR-u40uJP1yx6g/exec";

const SETTINGS = {
  eventName: "Theresa & Precious",
  maximumFileSizeMB: 25,
  maximumFilesPerUpload: 20,
  galleryRefreshTime: 60000
};

const state = {
  selectedFiles: [],
  selectedFileUrls: [],
  galleryTimer: null,
  toastTimer: null
};

const elements = {};

document.addEventListener(
  "DOMContentLoaded",
  startWebsite
);

function startWebsite() {
  collectElements();
  connectButtons();
  showCorrectPage();
  createQrCode();
  checkHeroImage();

  window.addEventListener(
    "hashchange",
    showCorrectPage
  );

  document.addEventListener(
    "keydown",
    handleEscapeKey
  );
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
    "successHome",
    "successGallery",
    "openQrCode",
    "qrDialog",
    "closeQrDialog",
    "qrCode",
    "qrWebsiteAddress",
    "shareWebsite",
    "toast",
"heroImage",
"memoryViewer",
"closeMemoryViewer",
"memoryViewerMedia",
"memoryViewerGuest",
"memoryViewerDate",
"downloadMemory"
  ];

  ids.forEach((id) => {
    elements[id] =
      document.getElementById(id);
  });

  elements.shareOptions =
    Array.from(
      document.querySelectorAll(
        ".share-option[data-input]"
      )
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
    button.addEventListener(
      "click",
      () => {
        const inputId =
          button.dataset.input;

        const input =
          document.getElementById(inputId);

        closeShareSheet();
        input.click();
      }
    );
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
  elements.uploadDialog.addEventListener(
    "click",
    (event) => {
      if (
        event.target ===
        elements.uploadDialog
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
  history.pushState(
    null,
    "",
    window.location.pathname +
      window.location.search
  );

  showHomeView();
}

function showGalleryView() {
  elements.homeView.hidden = true;
  elements.galleryView.hidden = false;

  window.scrollTo(0, 0);

  loadGallery(false);
  beginGalleryRefresh();
}

function showHomeView() {
  stopGalleryRefresh();

  elements.galleryView.hidden = true;
  elements.homeView.hidden = false;

  window.scrollTo(0, 0);
}

function openShareSheet() {
  elements.backdrop.hidden = false;
  elements.shareSheet.hidden = false;

  document.body.classList.add(
    "modal-open"
  );

  requestAnimationFrame(() => {
    elements.backdrop.classList.add(
      "visible"
    );

    elements.shareSheet.classList.add(
      "visible"
    );
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

    document.body.classList.remove(
      "modal-open"
    );
  }, 280);
}

function handleSelectedFiles(event) {
  const files =
    Array.from(
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
      "Please select no more than " +
        SETTINGS.maximumFilesPerUpload +
        " files at once."
    );

    return;
  }

  const validFiles = [];
  const rejectedFiles = [];

  files.forEach((file) => {
    const validationMessage =
      validateFile(file);

    if (validationMessage) {
      rejectedFiles.push(file.name);
    } else {
      validFiles.push(file);
    }
  });

  if (!validFiles.length) {
    showToast(
      "None of the selected files could be added. Use photos or videos smaller than " +
        SETTINGS.maximumFileSizeMB +
        " MB each."
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
      rejectedFiles.length +
        " file(s) were skipped because they were unsupported or too large."
    );
  }
}

function validateFile(file) {
  const isPhoto =
    file.type.startsWith("image/");

  const isVideo =
    file.type.startsWith("video/");

  if (!isPhoto && !isVideo) {
    return "Unsupported file";
  }

  const maximumBytes =
    SETTINGS.maximumFileSizeMB *
    1024 *
    1024;

  if (file.size > maximumBytes) {
    return "File too large";
  }

  return "";
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

      const fileUrl =
        state.selectedFileUrls[index];

      if (
        file.type.startsWith("image/")
      ) {
        const image =
          document.createElement("img");

        image.src = fileUrl;
        image.alt =
          "Selected wedding memory";

        previewItem.appendChild(image);
      } else {
        const video =
          document.createElement("video");

        video.src = fileUrl;
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
      previewGrid.appendChild(previewItem);
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
    state.selectedFiles.length +
    " " +
    fileWord +
    " selected · " +
    formatFileSize(totalSize);

  elements.confirmUpload.textContent =
    state.selectedFiles.length === 1
      ? "Add to the Album"
      : "Add " +
        state.selectedFiles.length +
        " Memories";
}

function openUploadDialog() {
  elements.uploadProgress.hidden = true;
  elements.uploadActions.hidden = false;
  elements.confirmUpload.disabled = false;

  elements.progressBar.style.width =
    "0%";

  elements.progressText.textContent =
    "Preparing your memories...";

  elements.uploadDialog.hidden = false;

  document.body.classList.add(
    "modal-open"
  );
}

function closeUploadDialog() {
  elements.uploadDialog.hidden = true;

  document.body.classList.remove(
    "modal-open"
  );

  elements.guestName.value = "";

  clearSelectedFiles();
}

function chooseAnotherFile() {
  elements.uploadDialog.hidden = true;

  document.body.classList.remove(
    "modal-open"
  );

  clearSelectedFiles();
  openShareSheet();
}

async function uploadMemories() {
  if (!state.selectedFiles.length) {
    showToast(
      "Please choose at least one photo or video."
    );

    return;
  }

  if (
    !GOOGLE_APPS_SCRIPT_URL ||
    !GOOGLE_APPS_SCRIPT_URL.endsWith(
      "/exec"
    )
  ) {
    showToast(
      "The Google Drive upload address has not been added correctly."
    );

    return;
  }

  setUploadingState(true);

  const totalFiles =
    state.selectedFiles.length;

  let successfulUploads = 0;
  const failedFiles = [];

  for (
    let index = 0;
    index < totalFiles;
    index += 1
  ) {
    const file =
      state.selectedFiles[index];

    const startingPercent =
      Math.round(
        (index / totalFiles) * 100
      );

    updateProgress(
      startingPercent,
      "Uploading " +
        (index + 1) +
        " of " +
        totalFiles +
        ": " +
        file.name
    );

    try {
      await uploadOneFile(file);

      successfulUploads += 1;
    } catch (error) {
      console.error(
        "Upload failed:",
        file.name,
        error
      );

      failedFiles.push(file.name);
    }
  }

  updateProgress(
    100,
    "Upload complete."
  );

  await wait(500);

  elements.uploadDialog.hidden = true;

  clearSelectedFiles();
  setUploadingState(false);

  if (!successfulUploads) {
    document.body.classList.remove(
      "modal-open"
    );

    showToast(
      "The files could not be uploaded. Please check the connection and try again."
    );

    return;
  }

  elements.successDialog.hidden = false;

  document.body.classList.add(
    "modal-open"
  );

  if (failedFiles.length) {
    showToast(
      successfulUploads +
        " file(s) uploaded. " +
        failedFiles.length +
        " file(s) failed."
    );
  }
}

async function uploadOneFile(file) {
  const base64File =
    await convertFileToBase64(file);

  const uploadData = {
    action: "upload",
    eventName: SETTINGS.eventName,
    guestName:
      elements.guestName.value.trim(),
    fileName:
      createSafeFileName(file.name),
    mimeType: file.type,
    base64: base64File,
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
      body: JSON.stringify(uploadData)
    }
  );

  await wait(350);
}

function setUploadingState(isUploading) {
  elements.uploadProgress.hidden =
    !isUploading;

  elements.uploadActions.hidden =
    isUploading;

  elements.confirmUpload.disabled =
    isUploading;

  if (isUploading) {
    updateProgress(
      3,
      "Preparing your memories..."
    );
  }
}

function loadGallery(
  showRefreshMessage
) {
  elements.emptyGallery.hidden = true;

  if (showRefreshMessage) {
    showToast(
      "Refreshing today's memories..."
    );
  }

  elements.galleryLoading.hidden = false;

  loadGalleryWithJsonp()
    .then((memories) => {
      renderGallery(memories);
    })
    .catch((error) => {
      console.error(error);

      elements.galleryGrid.replaceChildren();

      elements.emptyGallery.hidden = false;

      showToast(
        error.message ||
          "The gallery could not be loaded."
      );
    })
    .finally(() => {
      elements.galleryLoading.hidden = true;
    });
}

function loadGalleryWithJsonp() {
  return new Promise(
    (resolve, reject) => {
      const callbackName =
        "weddingGalleryCallback_" +
        Date.now();

      const script =
        document.createElement("script");

      const timeout =
        window.setTimeout(() => {
          cleanup();

          reject(
            new Error(
              "The wedding album took too long to load."
            )
          );
        }, 15000);

      function cleanup() {
        window.clearTimeout(timeout);

        if (script.parentNode) {
          script.parentNode.removeChild(
            script
          );
        }

        delete window[callbackName];
      }

      window[callbackName] =
        function (result) {
          cleanup();

          if (
            !result ||
            !result.success ||
            !Array.isArray(result.files)
          ) {
            reject(
              new Error(
                result &&
                result.message
                  ? result.message
                  : "The gallery returned an invalid response."
              )
            );

            return;
          }

          resolve(result.files);
        };

      const separator =
        GOOGLE_APPS_SCRIPT_URL.includes(
          "?"
        )
          ? "&"
          : "?";

      script.src =
        GOOGLE_APPS_SCRIPT_URL +
        separator +
        "action=list" +
        "&callback=" +
        encodeURIComponent(
          callbackName
        ) +
        "&t=" +
        Date.now();

      script.onerror = () => {
        cleanup();

        reject(
          new Error(
            "The wedding gallery could not connect to Google Drive."
          )
        );
      };

      document.body.appendChild(script);
    }
  );
}

function renderGallery(memories) {
  elements.galleryGrid.replaceChildren();

  if (!memories.length) {
    elements.emptyGallery.hidden = false;
    return;
  }

  elements.emptyGallery.hidden = true;

  memories.forEach((memory) => {
    const card =
      document.createElement("button");

    card.type = "button";
    card.className = "memory-card";

    const guestName =
      memory.guestName ||
      "A Wedding Guest";

    const isVideo =
      String(
        memory.mimeType || ""
      ).startsWith("video/");

    card.setAttribute(
      "aria-label",
      isVideo
        ? "Open video shared by " + guestName
        : "Open photo shared by " + guestName
    );

    const mediaBox =
      document.createElement("div");

    mediaBox.className = "memory-media";

    const thumbnail =
      document.createElement("img");

    thumbnail.src =
      memory.thumbnailUrl ||
      memory.url ||
      "";

    thumbnail.alt =
      isVideo
        ? "Wedding video shared by " + guestName
        : "Wedding photo shared by " + guestName;

    thumbnail.loading = "lazy";

    mediaBox.appendChild(thumbnail);

    if (isVideo) {
      const videoBadge =
        document.createElement("span");

      videoBadge.className = "video-badge";
      videoBadge.setAttribute(
        "aria-hidden",
        "true"
      );

      videoBadge.textContent = "▶";

      mediaBox.appendChild(videoBadge);
    }

    card.appendChild(mediaBox);

    card.addEventListener(
      "click",
      () => {
        openMemoryViewer(memory);
      }
    );

    elements.galleryGrid.appendChild(card);
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
      document.createElement("iframe");

    frame.src =
      memory.embedUrl ||
      memory.driveUrl ||
      "";

    frame.title =
      "Wedding video shared by " +
      (
        memory.guestName ||
        "a guest"
      );

    frame.allow =
      "autoplay; fullscreen";

    frame.setAttribute(
      "allowfullscreen",
      ""
    );

    elements.memoryViewerMedia.appendChild(
      frame
    );
  } else {
    const image =
      document.createElement("img");

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
      "Wedding memory shared by " +
      (
        memory.guestName ||
        "a guest"
      );

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

  elements.memoryViewer.hidden = false;

  document.body.classList.add(
    "modal-open"
  );
}

function closeMemoryViewer() {
  elements.memoryViewer.hidden = true;

  elements.memoryViewerMedia.replaceChildren();

  elements.downloadMemory.href = "#";

  document.body.classList.remove(
    "modal-open"
  );
} {
  elements.successDialog.hidden = true;

  document.body.classList.remove(
    "modal-open"
  );

  elements.guestName.value = "";
}

function openQrDialog() {
  elements.qrDialog.hidden = false;

  document.body.classList.add(
    "modal-open"
  );
}

function closeQrDialog() {
  elements.qrDialog.hidden = true;

  document.body.classList.remove(
    "modal-open"
  );
}

function createQrCode() {
  const websiteUrl =
    getWebsiteUrl();

  elements.qrWebsiteAddress.textContent =
    websiteUrl;

  if (
    typeof QRCode === "undefined"
  ) {
    window.setTimeout(
      createQrCode,
      300
    );

    return;
  }

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
      error.name !== "AbortError"
    ) {
      showToast(
        "Copy this address: " +
          websiteUrl
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
  if (event.key !== "Escape") {
    return;
  }

  if (!elements.memoryViewer.hidden) {
  closeMemoryViewer();
} else if (!elements.qrDialog.hidden) {
  closeQrDialog();
  } else if (
    !elements.successDialog.hidden
  ) {
    closeSuccessDialog();
  } else if (
    !elements.uploadDialog.hidden
  ) {
    closeUploadDialog();
  } else if (
    !elements.shareSheet.hidden
  ) {
    closeShareSheet();
  }
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
  if (state.galleryTimer) {
    window.clearInterval(
      state.galleryTimer
    );

    state.galleryTimer = null;
  }
}

function clearSelectedFiles() {
  state.selectedFileUrls.forEach(
    (url) => {
      URL.revokeObjectURL(url);
    }
  );

  state.selectedFiles = [];
  state.selectedFileUrls = [];

  elements.previewArea.replaceChildren();

  elements.selectedFileDetails.textContent =
    "";

  elements.confirmUpload.textContent =
    "Add to the Album";
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

        const base64Value =
          result.includes(",")
            ? result.split(",")[1]
            : result;

        resolve(base64Value);
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

function createSafeFileName(
  originalName
) {
  const time =
    new Date()
      .toISOString()
      .replace(/[:.]/g, "-");

  const cleanName =
    originalName.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );

  return time + "_" + cleanName;
}

function updateProgress(
  percent,
  message
) {
  elements.progressBar.style.width =
    percent + "%";

  elements.progressText.textContent =
    message;
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) {
    const kilobytes =
      Math.max(
        1,
        Math.round(bytes / 1024)
      );

    return kilobytes + " KB";
  }

  const megabytes =
    (
      bytes /
      (1024 * 1024)
    ).toFixed(1);

  return megabytes + " MB";
}

function formatMemoryDate(dateValue) {
  if (!dateValue) {
    return "Today";
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Today";
  }

  return new Intl.DateTimeFormat(
    "en-NG",
    {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit"
    }
  ).format(date);
}

function showToast(message) {
  window.clearTimeout(
    state.toastTimer
  );

  elements.toast.textContent =
    message;

  elements.toast.hidden = false;

  state.toastTimer =
    window.setTimeout(
      () => {
        elements.toast.hidden = true;
      },
      3800
    );
}

function wait(milliseconds) {
  return new Promise(
    (resolve) => {
      window.setTimeout(
        resolve,
        milliseconds
      );
    }
  );
}