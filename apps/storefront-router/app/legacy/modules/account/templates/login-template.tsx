"use client"

import Login from "@modules/account/components/login"
import Register from "@modules/account/components/register"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState<string>(LOGIN_VIEW.SIGN_IN)
  /*
   * `?redirect=/checkout?step=address` — where to go once signed in. Set by
   * the prompt in the cart and the one at the top of checkout; absent
   * everywhere else, which leaves the account dashboard as the destination.
   */
  const redirectTo = useSearchParams().get("redirect") ?? undefined

  return (
    <div className="flex justify-center">
      {currentView === LOGIN_VIEW.SIGN_IN ? (
        <Login setCurrentView={setCurrentView} redirectTo={redirectTo} />
      ) : (
        <Register setCurrentView={setCurrentView} />
      )}
    </div>
  )
}

export default LoginTemplate
