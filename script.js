"use strict";

/*
  GOOGLE DRIVE CONNECTION

  We will create the Google Apps Script backend separately.

  When it has been created, paste its web app address
  between the quotation marks below.
*/

const GOOGLE_APPS_SCRIPT_URL = "";

const SETTINGS = {
  eventName: "Theresa & Precious",
  maximumFileSizeMB: 25,
  galleryRefreshTime: 60000
};

const state = {
  selectedFile: null,
  selectedFileUrl: "",
  demoMemories: [],
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
    "heroImage"
  ];

  ids.forEach((id) => {
    elements[id] = document.getElementById(id);
  });

  elements.shareOptions = Array.from(
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
    button.addEventListener("click", () => {
      const inputId = button.dataset.input;
      const input = document.getElementById(inputId);

      closeShareSheet();
      input.click();
    });
  });

  elements.fileInputs.forEach((input) => {
    input.addEventListener(
      "change",
      handleSelectedFile
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
    uploadMemory
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

  elements.uploadDialog.addEventListener(
    "click",
    (event) => {
      if (event.target === elements.uploadDialog) {
        closeUploadDialog();
      }
    }
  );

  elements.successDialog.addEventListener(
    "click",
    (event) => {
      if (event.target === elements.successDialog) {
        closeSuccessDialog();
      }
    }
  );

  elements.qrDialog.addEventListener(
    "click",
    (event) => {
      if (event.target === elements.qrDialog) {
        closeQrDialog();
      }
    }
  );
}

function showCorrectPage() {
  if (window.location.hash === "#gallery") {
    showGalleryView();
  } else {
    showHomeView();
  }
}

function openGalleryPage() {
  if (window.location.hash !== "#gallery") {
    window.location.hash = "gallery";
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

  document.body.classList.add("modal-open");

  requestAnimationFrame(() => {
    elements.backdrop.classList.add("visible");
    elements.shareSheet.classList.add("visible");
  });
}

function closeShareSheet() {
  elements.backdrop.classList.remove("visible");
  elements.shareSheet.classList.remove("visible");

  window.setTimeout(() => {
    elements.backdrop.hidden = true;
    elements.shareSheet.hidden = true;

    document.body.classList.remove("modal-open");
  }, 280);
}

function handleSelectedFile(event) {
  const file =
    event.target.files &&
    event.target.files[0];

  event.target.value = "";

  if (!file) {
    return;
  }

  const validationMessage =
    validateFile(file);

  if (validationMessage) {
    showToast(validationMessage);
    return;
  }

  clearSelectedFile();

  state.selectedFile = file;

  state.selectedFileUrl =
    URL.createObjectURL(file);

  showFilePreview(
    file,
    state.selectedFileUrl
  );

  openUploadDialog();
}

function validateFile(file) {
  const isPhoto =
    file.type.startsWith("image/");

  const isVideo =
    file.type.startsWith("video/");

  if (!isPhoto && !isVideo) {
    return "Please choose a photo or video file.";
  }

  const maximumBytes =
    SETTINGS.maximumFileSizeMB *
    1024 *
    1024;

  if (file.size > maximumBytes) {
    return (
      "Please choose a file smaller than " +
      SETTINGS.maximumFileSizeMB +
      " MB."
    );
  }

  return "";
}

function showFilePreview(
  file,
  fileUrl
) {
  elements.previewArea.replaceChildren();

  if (file.type.startsWith("image/")) {
    const image =
      document.createElement("img");

    image.src = fileUrl;
    image.alt = "Selected wedding memory";

    elements.previewArea.appendChild(image);
  } else {
    const video =
      document.createElement("video");

    video.src = fileUrl;
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";

    elements.previewArea.appendChild(video);
  }

  elements.selectedFileDetails.textContent =
    file.name +
    " · " +
    formatFileSize(file.size);
}

function openUploadDialog() {
  elements.uploadProgress.hidden = true;
  elements.uploadActions.hidden = false;
  elements.confirmUpload.disabled = false;

  elements.progressBar.style.width = "0%";

  elements.progressText.textContent =
    "Preparing your memory...";

  elements.uploadDialog.hidden = false;

  document.body.classList.add("modal-open");
}

function closeUploadDialog() {
  elements.uploadDialog.hidden = true;

  document.body.classList.remove("modal-open");

  elements.guestName.value = "";

  clearSelectedFile();
}

function chooseAnotherFile() {
  elements.uploadDialog.hidden = true;

  document.body.classList.remove("modal-open");

  clearSelectedFile();
  openShareSheet();
}

async function uploadMemory() {
  if (!state.selectedFile) {
    showToast(
      "Please choose a photo or video first."
    );

    return;
  }

  setUploadingState(true);

  try {
    if (!GOOGLE_APPS_SCRIPT_URL.trim()) {
      saveDemoMemory();

      await wait(700);
    } else {
      await uploadToGoogleDrive();
    }

    elements.uploadDialog.hidden = true;

    clearSelectedFile();
    setUploadingState(false);

    elements.successDialog.hidden = false;

    document.body.classList.add("modal-open");
  } catch (error) {
    console.error(error);

    setUploadingState(false);

    showToast(
      error.message ||
      "The upload did not complete. Please try again."
    );
  }
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
      12,
      "Preparing your memory..."
    );
  }
}

async function uploadToGoogleDrive() {
  const file = state.selectedFile;

  const base64File =
    await convertFileToBase64(file);

  updateProgress(
    38,
    "Sending your memory securely..."
  );

  const response = await fetch(
    GOOGLE_APPS_SCRIPT_URL,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "text/plain;charset=utf-8"
      },

      body: JSON.stringify({
        action: "upload",

        eventName:
          SETTINGS.eventName,

        guestName:
          elements.guestName.value.trim(),

        fileName:
          createSafeFileName(file.name),

        mimeType:
          file.type,

        base64:
          base64File,

        uploadedAt:
          new Date().toISOString()
      })
    }
  );

  updateProgress(
    82,
    "Adding it to the wedding album..."
  );

  if (!response.ok) {
    throw new Error(
      "The upload service could not be reached."
    );
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(
      result.message ||
      "Google Drive did not accept the file."
    );
  }

  updateProgress(
    100,
    "Your memory has been added."
  );

  await wait(450);
}

function saveDemoMemory() {
  const file = state.selectedFile;

  state.demoMemories.unshift({
    id:
      "demo-" +
      Date.now(),

    name:
      file.name,

    mimeType:
      file.type,

    url:
      state.selectedFileUrl,

    thumbnailUrl:
      state.selectedFileUrl,

    guestName:
      elements.guestName.value.trim() ||
      "A Wedding Guest",

    createdAt:
      new Date().toISOString(),

    demo:
      true
  });

  updateProgress(
    100,
    "Your memory has been added for this preview."
  );
}

async function loadGallery(
  showRefreshMessage
) {
  elements.emptyGallery.hidden = true;

  if (showRefreshMessage) {
    showToast(
      "Refreshing today's memories..."
    );
  }

  elements.galleryLoading.hidden = false;

  try {
    let memories = [];

    if (!GOOGLE_APPS_SCRIPT_URL.trim()) {
      memories = state.demoMemories;
    } else {
      const separator =
        GOOGLE_APPS_SCRIPT_URL.includes("?")
          ? "&"
          : "?";

      const galleryUrl =
        GOOGLE_APPS_SCRIPT_URL +
        separator +
        "action=list&t=" +
        Date.now();

      const response =
        await fetch(galleryUrl);

      if (!response.ok) {
        throw new Error(
          "The wedding album could not be loaded."
        );
      }

      const result =
        await response.json();

      if (
        !result.success ||
        !Array.isArray(result.files)
      ) {
        throw new Error(
          result.message ||
          "The wedding album returned an invalid response."
        );
      }

      memories = result.files;
    }

    renderGallery(memories);
  } catch (error) {
    console.error(error);

    elements.galleryGrid.replaceChildren();

    elements.emptyGallery.hidden = false;

    showToast(
      error.message ||
      "The gallery could not be loaded."
    );
  } finally {
    elements.galleryLoading.hidden = true;
  }
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
      document.createElement("article");

    card.className = "memory-card";

    const mediaBox =
      document.createElement("div");

    mediaBox.className = "memory-media";

    const isVideo =
      String(
        memory.mimeType || ""
      ).startsWith("video/");

    if (isVideo) {
      const video =
        document.createElement("video");

      video.src =
        memory.url ||
        memory.previewUrl ||
        "";

      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";

      if (memory.thumbnailUrl) {
        video.poster =
          memory.thumbnailUrl;
      }

      mediaBox.appendChild(video);
    } else {
      const image =
        document.createElement("img");

      image.src =
        memory.thumbnailUrl ||
        memory.url ||
        "";

      image.alt =
        "Wedding memory shared by " +
        (
          memory.guestName ||
          "a guest"
        );

      image.loading = "lazy";

      mediaBox.appendChild(image);
    }

    const details =
      document.createElement("div");

    details.className =
      "memory-details";

    const guestName =
      document.createElement("strong");

    guestName.textContent =
      memory.guestName ||
      "A Wedding Guest";

    const date =
      document.createElement("small");

    date.textContent =
      formatMemoryDate(
        memory.createdAt
      );

    details.append(
      guestName,
      date
    );

    card.append(
      mediaBox,
      details
    );

    elements.galleryGrid.appendChild(card);
  });
}

function closeSuccessDialog() {
  elements.successDialog.hidden = true;

  document.body.classList.remove("modal-open");

  elements.guestName.value = "";
}

function openQrDialog() {
  elements.qrDialog.hidden = false;

  document.body.classList.add("modal-open");
}

function closeQrDialog() {
  elements.qrDialog.hidden = true;

  document.body.classList.remove("modal-open");
}

function createQrCode() {
  const websiteUrl =
    getWebsiteUrl();

  elements.qrWebsiteAddress.textContent =
    websiteUrl;

  if (typeof QRCode === "undefined") {
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
      text:
        websiteUrl,

      width:
        260,

      height:
        260,

      colorDark:
        "#51132e",

      colorLight:
        "#ffffff",

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

        url:
          websiteUrl
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
    if (error.name !== "AbortError") {
      showToast(
        "Copy this address: " +
        websiteUrl
      );
    }
  }
}

function getWebsiteUrl() {
  return window.location.href.split("#")[0];
}

function checkHeroImage() {
  elements.heroImage.addEventListener(
    "error",
    () => {
      elements.heroImage.alt =
        "Add the approved wedding photo and name the file hero.jpg";

      showToast(
        "The hero image is missing. Upload the photo and name it hero.jpg."
      );
    }
  );
}

function handleEscapeKey(event) {
  if (event.key !== "Escape") {
    return;
  }

  if (!elements.qrDialog.hidden) {
    closeQrDialog();
  } else if (!elements.successDialog.hidden) {
    closeSuccessDialog();
  } else if (!elements.uploadDialog.hidden) {
    closeUploadDialog();
  } else if (!elements.shareSheet.hidden) {
    closeShareSheet();
  }
}

function beginGalleryRefresh() {
  stopGalleryRefresh();

  state.galleryTimer =
    window.setInterval(
      () => {
        if (!elements.galleryView.hidden) {
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

function clearSelectedFile() {
  const fileIsInDemoGallery =
    state.demoMemories.some(
      (item) =>
        item.url === state.selectedFileUrl
    );

  if (
    state.selectedFileUrl &&
    !fileIsInDemoGallery
  ) {
    URL.revokeObjectURL(
      state.selectedFileUrl
    );
  }

  state.selectedFile = null;
  state.selectedFileUrl = "";

  elements.previewArea.replaceChildren();

  elements.selectedFileDetails.textContent =
    "";
}

function convertFileToBase64(file) {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload = () => {
        const result =
          String(reader.result || "");

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

  return (
    time +
    "_" +
    cleanName
  );
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

  if (Number.isNaN(date.getTime())) {
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