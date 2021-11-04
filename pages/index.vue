<template>
  <div>
    <h1>Workshop Downloader</h1>
    <br />
    <v-card>
      <v-card-title>Enter Steam Workshop Link(s)</v-card-title>
      <v-card-subtitle>
        Valid inputs: <br />
        Link -
        <span class="green--text"
          >https://steamcommunity.com/sharedfiles/filedetails/?id=421596934</span
        >
        <br />
        ID - <span class="green--text">685184665</span>
      </v-card-subtitle>
      <v-card-text>
        <v-textarea
          v-model="text"
          clearable
          background-color="grey darken-3"
        ></v-textarea>
        <label v-show="error" class="red--text" for="text">{{ error }}</label>
        <div class="d-flex flex-row-reverse">
          <v-btn @click="load" color="green" :disabled="!isValid">Load</v-btn>
        </div>
        <v-data-table
          :headers="headers"
          :items="items"
          item-key="id"
          class="elevation-2"
        >
          <template v-slot:item.download="{ item }">
            <v-btn @click="downloadMap(item)" color="green" small
              >Download</v-btn
            >
          </template>
        </v-data-table>
        <v-divider class="py-4"></v-divider>
        <div class="d-flex flex-row-reverse">
          <v-btn
            @click="download"
            color="primary"
            :disabled="items.length === 0"
            >Download Maps</v-btn
          >
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
function triggerFileDownload(filename, blob) {
  const dlBlob = new Blob([blob], {
    type: "application/octet-stream",
  });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(dlBlob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
}

export default {
  data() {
    return {
      headers: [
        {
          text: "ID",
          value: "publishedfileid",
        },
        {
          text: "Name",
          value: "title",
        },
        {
          text: "Size",
          value: "file_size",
        },
        {
          text: "Download",
          value: "download",
        },
      ],
      items: [],
      text: " 685184665",
      error: false,
    };
  },
  computed: {
    isValid() {
      const text = this.text && this.text.trim();
      // Trim and check if empty
      if (!text) {
        this.error = "No valid input";
        return false;
      }

      const lines = text.split(/\r?\n/);
      for (const line of lines) {
        if (!line.trim()) {
          this.error = "A line has an invalid input";
          return false;
        }
        const id = this.getWorkshopId(line.trim());
        if (!id) {
          this.error = "A line has an invalid input";
          return false;
        }
      }
      this.error = false;
      return true;
    },
  },
  methods: {
    async getItems() {
      this.items = await this.$axios.$get("/api/items");
    },
    getWorkshopId(line) {
      if (!isNaN(Number(line))) {
        return Number(line);
      }
      if (
        line.startsWith(
          "https://steamcommunity.com/sharedfiles/filedetails/?id="
        )
      ) {
        return Number(line.substring(line.indexOf("=") + 1));
      }
      return "";
    },
    async load() {
      const lines = this.text.split(/\r?\n/);
      this.items = [];
      const workshopIds = [];
      for (const line of lines) {
        const id = this.getWorkshopId(line.trim());
        if (!workshopIds.includes(id)) {
          workshopIds.push(id);
        }
      }

      const res = await this.$axios.$post("/api/workshop", workshopIds);
      for (const item of res) {
        this.items.push(item);
      }
      console.log(res);
    },
    async downloadMap(workshop) {
      console.log(workshop);
      const data = await this.$axios.$post(
        "/api/workshop/downloadmap",
        workshop
      );
      triggerFileDownload(workshop.name, data);
    },
    async download() {},
  },
};
</script>
