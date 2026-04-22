
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

function getEnv() {
  const envPath = path.join(process.cwd(), '.env')
  const content = fs.readFileSync(envPath, 'utf-8')
  const env: Record<string, string> = {}
  content.split('\n').forEach(line => {
    const [key, ...val] = line.split('=')
    if (key && val.length > 0) {
      env[key.trim()] = val.join('=').trim().replace(/^"(.*)"$/, '$1')
    }
  })
  return env
}

const env = getEnv()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createDriversBucket() {
  const { data, error } = await supabase.storage.createBucket('drivers', {
    public: true
  })
  if (error) {
    console.error('Error creating bucket:', error)
  } else {
    console.log('Bucket created successfully:', data)
  }
}

createDriversBucket()
