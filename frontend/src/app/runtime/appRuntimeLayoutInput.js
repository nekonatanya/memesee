import {
  buildActionsLayoutInput,
  buildAuthLayoutInput,
  buildCommunityLayoutInput,
  buildComposerLayoutInput,
  buildDetailLayoutInput,
  buildFeedLayoutInput,
  buildNotificationsLayoutInput,
  buildProfileLayoutInput,
  buildShellLayoutInput,
  buildSubPostThreadLayoutInput,
} from "./layout/appRuntimeLayoutSectionBuilders";

export function buildShellSectionLayoutInput(dependencies) {
  return {
    shell: buildShellLayoutInput(dependencies),
    community: buildCommunityLayoutInput(dependencies),
    feed: buildFeedLayoutInput(dependencies),
    profile: buildProfileLayoutInput(dependencies),
    notifications: buildNotificationsLayoutInput(dependencies),
  };
}

export function buildContentSectionLayoutInput(dependencies) {
  return {
    detail: buildDetailLayoutInput(dependencies),
    subPostThread: buildSubPostThreadLayoutInput(dependencies),
    composer: buildComposerLayoutInput(dependencies),
  };
}

export function buildControlSectionLayoutInput(dependencies) {
  return {
    actions: buildActionsLayoutInput(dependencies),
    auth: buildAuthLayoutInput(dependencies),
  };
}

export function buildAppRuntimeLayoutInput(dependencies) {
  return {
    ...buildShellSectionLayoutInput(dependencies),
    ...buildContentSectionLayoutInput(dependencies),
    ...buildControlSectionLayoutInput(dependencies),
    refs: dependencies.refs,
    helpers: dependencies.helpers,
  };
}
