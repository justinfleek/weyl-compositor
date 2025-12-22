const COCO_BONES = [
  // Head
  [0, 1],
  // nose -> neck
  [0, 14],
  // nose -> right_eye
  [0, 15],
  // nose -> left_eye
  [14, 16],
  // right_eye -> right_ear
  [15, 17],
  // left_eye -> left_ear
  // Torso
  [1, 2],
  // neck -> right_shoulder
  [1, 5],
  // neck -> left_shoulder
  [1, 8],
  // neck -> right_hip
  [1, 11],
  // neck -> left_hip
  // Right arm
  [2, 3],
  // right_shoulder -> right_elbow
  [3, 4],
  // right_elbow -> right_wrist
  // Left arm
  [5, 6],
  // left_shoulder -> left_elbow
  [6, 7],
  // left_elbow -> left_wrist
  // Right leg
  [8, 9],
  // right_hip -> right_knee
  [9, 10],
  // right_knee -> right_ankle
  // Left leg
  [11, 12],
  // left_hip -> left_knee
  [12, 13]
  // left_knee -> left_ankle
];
const OPENPOSE_COLORS = {
  // Head - yellow/orange
  head: "#FFD700",
  // Right side - warm colors (red/orange)
  right_arm: "#FF0000",
  right_leg: "#FF6600",
  // Left side - cool colors (blue/cyan)
  left_arm: "#0000FF",
  left_leg: "#00CCFF",
  // Torso - green
  torso: "#00FF00"
};
function getBoneColor(boneIndex) {
  const bone = COCO_BONES[boneIndex];
  if (!bone) return "#FFFFFF";
  if (boneIndex <= 4) return OPENPOSE_COLORS.head;
  if (boneIndex >= 5 && boneIndex <= 8) return OPENPOSE_COLORS.torso;
  if (boneIndex >= 9 && boneIndex <= 10) return OPENPOSE_COLORS.right_arm;
  if (boneIndex >= 11 && boneIndex <= 12) return OPENPOSE_COLORS.left_arm;
  if (boneIndex >= 13 && boneIndex <= 14) return OPENPOSE_COLORS.right_leg;
  if (boneIndex >= 15 && boneIndex <= 16) return OPENPOSE_COLORS.left_leg;
  return "#FFFFFF";
}

function renderPoseFrame(poses, config) {
  const canvas = document.createElement("canvas");
  canvas.width = config.width;
  canvas.height = config.height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = config.backgroundColor;
  ctx.fillRect(0, 0, config.width, config.height);
  for (const pose of poses) {
    renderSinglePose(ctx, pose, config);
  }
  return canvas;
}
function renderSinglePose(ctx, pose, config) {
  const { keypoints } = pose;
  const { width, height } = config;
  const toPixel = (kp) => ({
    x: kp.x * width,
    y: kp.y * height,
    visible: kp.confidence > 0.1
  });
  if (config.showBones) {
    ctx.lineCap = "round";
    ctx.lineWidth = config.boneWidth;
    COCO_BONES.forEach((bone, boneIndex) => {
      const [startIdx, endIdx] = bone;
      if (startIdx >= keypoints.length || endIdx >= keypoints.length) return;
      const start = toPixel(keypoints[startIdx]);
      const end = toPixel(keypoints[endIdx]);
      if (!start.visible || !end.visible) return;
      ctx.strokeStyle = config.useOpenPoseColors ? getBoneColor(boneIndex) : config.customColor || "#FFFFFF";
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    });
  }
  if (config.showKeypoints) {
    keypoints.forEach((kp, index) => {
      const point = toPixel(kp);
      if (!point.visible) return;
      let color = config.customColor || "#FFFFFF";
      if (config.useOpenPoseColors) {
        if (index <= 1 || index >= 14 && index <= 17) {
          color = OPENPOSE_COLORS.head;
        } else if (index >= 2 && index <= 4) {
          color = OPENPOSE_COLORS.right_arm;
        } else if (index >= 5 && index <= 7) {
          color = OPENPOSE_COLORS.left_arm;
        } else if ([8, 9, 10].includes(index)) {
          color = OPENPOSE_COLORS.right_leg;
        } else if ([11, 12, 13].includes(index)) {
          color = OPENPOSE_COLORS.left_leg;
        }
      }
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, config.keypointRadius, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}
function exportToOpenPoseJSON(poses) {
  const people = poses.map((pose) => {
    const pose_keypoints_2d = [];
    for (const kp of pose.keypoints) {
      pose_keypoints_2d.push(kp.x, kp.y, kp.confidence);
    }
    return {
      person_id: [-1],
      pose_keypoints_2d,
      face_keypoints_2d: [],
      hand_left_keypoints_2d: [],
      hand_right_keypoints_2d: [],
      pose_keypoints_3d: [],
      face_keypoints_3d: [],
      hand_left_keypoints_3d: [],
      hand_right_keypoints_3d: []
    };
  });
  return {
    version: 1.3,
    people
  };
}
function exportPoseForControlNet(poses, width, height) {
  const config = {
    width,
    height,
    boneWidth: 4,
    keypointRadius: 4,
    showKeypoints: true,
    showBones: true,
    useOpenPoseColors: true,
    backgroundColor: "#000000"};
  return {
    canvas: renderPoseFrame(poses, config),
    json: exportToOpenPoseJSON(poses)
  };
}

export { exportPoseForControlNet, exportToOpenPoseJSON, renderPoseFrame };
