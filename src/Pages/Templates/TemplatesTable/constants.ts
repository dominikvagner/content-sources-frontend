import { NameLabel } from '../../../services/Content/ContentApi';

export const SUPPORTED_MAJOR_VERSIONS = ['8', '9', '10'];
export const SUPPORTED_ARCHES = ['x86_64', 'aarch64'];
export const SUPPORTED_EUS_ARCHES = ['x86_64'];

export const STANDARD_STREAM: NameLabel = { label: '', name: 'Standard' };
export const STANDARD_STREAM_PATH = 'dist';

export const TEMPLATE_SYSTEMS_UPDATE_LIMIT = 1000;

export const TEMPLATES_DOCS_URL =
  'https://docs.redhat.com/en/documentation/red_hat_lightspeed/1-latest/html/managing_system_content_and_patch_updates_on_rhel_systems/patching-using-content-templates_patch-service-overview';
