const _ = require("lodash");
const path = require("path");

// Get config from index.json for an SVG file.
// Search in the svg_path directory and all parent
// directories up to root.
// TODO: DOCUMENT this
function get_config(svg_path, root, fs) {
  let dirs = path.relative(root, svg_path).split(path.sep);
  let config = {};
  dirs.forEach(function (dir, index) {
    // Search for index.json in all folders from the filepath up to root
    const json_path = path.join(root, ...dirs.slice(0, index), "index.json");
    if (fs.existsSync(json_path)) {
      // Load every index.json found
      let subconfig = JSON.parse(fs.readFileSync(json_path));
      // If it has is an "import", import that configuration
      if (subconfig.import) {
        const extend_path = path.join(json_path, "..", subconfig.import);
        _.merge(config, get_config(extend_path, root, fs));
        _.unset(subconfig, "import");
      }
      // In any case, merge this index.json
      _.merge(config, subconfig);
    }
  });
  return config;
}

exports.get_config = get_config;
