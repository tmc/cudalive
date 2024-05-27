import { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
    schema: '../cudalive-backend/schema.graphql',
    documents: ['src/**/*.tsx'],
    ignoreNoDocuments: true,
    generates: {
        './src/gql-gen/': {
            preset: 'client'
        }
    }
}


export default config
