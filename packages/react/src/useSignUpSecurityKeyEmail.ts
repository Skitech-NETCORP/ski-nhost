import {
  SignUpSecurityKeyOptions,
  signUpSecurityKeyPromise,
  SignUpSecurityKeyState
} from '@nhost/core'
import { useSelector } from '@xstate/react'

import { useAuthInterpreter } from './useAuthInterpreter'

type SignUpSecurityKeyHandlerResult = Omit<SignUpSecurityKeyState, 'isLoading'>

interface SignUpSecurityKeyHandler {
  (email: string, options?: SignUpSecurityKeyOptions): Promise<SignUpSecurityKeyHandlerResult>
}

export interface SignUpSecurityKeyHookResult extends SignUpSecurityKeyState {
  /** Used for a new user to sign up with a security key. Returns a promise with the current context */
  signUpSecurityKeyEmail: SignUpSecurityKeyHandler
}

interface SignUpSecurityKeyHook {
  (options?: SignUpSecurityKeyOptions): SignUpSecurityKeyHookResult
}

/**
 * Use the hook `useSignUpSecurityKey` to sign up a user with security key and an email using the WebAuthn API.
 *
 * @example
 * ```tsx
 * const { signUpSecurityKey, needsEmailVerification, isLoading, isSuccess, isError, error } = useSignUpSecurityKey()
 *
 * console.log({ needsEmailVerification, isLoading, isSuccess, isError, error });
 *
 * const handleFormSubmit = async (e) => {
 *   e.preventDefault();
 *
 *   await signUpSecurityKey('joe@example.com')
 * }
 * ```
 *
 * @docs https://docs.nhost.io/reference/react/use-sign-up-security-key
 */
export const useSignUpSecurityKeyEmail: SignUpSecurityKeyHook = (
  hookOptions?: SignUpSecurityKeyOptions
) => {
  const service = useAuthInterpreter()
  const isError = useSelector(service, (state) => !!state.context.errors.registration)

  const error = useSelector(
    service,
    (state) => state.context.errors.registration || null,
    (a, b) => a?.error === b?.error
  )

  const isLoading = useSelector(service, (state) => state.matches('registration.securityKey'))

  const needsEmailVerification = useSelector(service, (state) =>
    state.matches('registration.incomplete.needsEmailVerification')
  )

  const isSuccess = useSelector(service, (state) =>
    state.matches({
      authentication: 'signedIn',
      registration: 'complete'
    })
  )

  const signUpSecurityKeyEmail: SignUpSecurityKeyHandler = (email, options = hookOptions) =>
    signUpSecurityKeyPromise(service, email, options)

  const user = useSelector(
    service,
    (state) => state.context.user,
    (a, b) => a?.id === b?.id
  )
  const accessToken = useSelector(service, (state) => state.context.accessToken.value)

  return {
    accessToken,
    error,
    isError,
    isLoading,
    isSuccess,
    needsEmailVerification,
    signUpSecurityKeyEmail,
    user
  }
}
