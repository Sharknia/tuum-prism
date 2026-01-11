/**
 * Vercel API 모듈 통합
 */

export { apiRequest, getClient, initClient } from './client';
export {
    createDeployment,
    getDeploymentStatus,
    prepareFiles,
    uploadFiles,
    waitForDeployment,
    type Deployment,
    type DeploymentFile,
    type DeploymentOptions,
    type DeploymentStatus
} from './deploy';
export {
    addDomain,
    checkSubdomainAvailability,
    getDomains,
    removeDomain,
    validateDomainName,
    type Domain
} from './domain';
export {
    deleteEnvVariable,
    getEnvVariables,
    setEnvVariables,
    type EnvVariable,
    type EnvVariableResponse
} from './env';
export {
    createProject,
    getProject,
    listProjects,
    type CreateProjectOptions,
    type Project
} from './project';

