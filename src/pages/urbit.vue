<template>
  <main class="page-shell">
    <header class="page-header">
      <h1 class="page-title">Urbit Guide</h1>
      <p class="page-subtitle">
        Play Nichess against another person through Urbit.
      </p>
    </header>

    <article class="site-panel">
      <p>Don't worry if this seems too difficult. Soon we'll have real servers that are
        simple to use and Urbit will only be used by the developers.</p>
      <p>
        <b>NOTE:</b> There is no matchmaking system. If you want to play against someone, you'll need
        to know their username.
      </p>
      <h2>1. Get an Urbit ship</h2>
      <p>
        Unfortunately this is not as simple as it should be. Here's the official <a class="site-link"
          href="https://docs.urbit.org/get-on-urbit">Get on Urbit</a> guide. You have a few options.
      </p>
      <h3>1.1 Mine a comet</h3>
      <p>
        If you're using a desktop or a laptop, your best choice is to mine a comet for free (steps 3
        and 4 in the previous link). If you're on Windows, you'll need to use WSL. The whole process
        should look something like:
      </p>
      <code class="code-line">curl -L https://urbit.org/install/linux-x86_64/latest | tar xzk --transform='s/.*/urbit/g'</code>
      <code class="code-line">./urbit -c mycomet</code>
      <code class="code-line">./mycomet/.run</code>
      <code class="code-line">+code</code>
      <p>
        Open http://localhost:8080 in your web browser and paste the password that you got from the
        +code command. When you're done using your comet, press Ctrl + D to shut it down.
      </p>
      <h3>1.2 Get a free ship from Tlon</h3>
      <p>
        Unlike mining a comet, this will work on any platform. If you go to <a class="site-link"
          href="https://docs.urbit.org/get-on-urbit">Get on Urbit</a>, you should see an invite link
        under "Get on Urbit faster" section. Click the link and follow the instructions. It might take
        a day or two for your account to get activated. When that happens, go to <a class="site-link"
          href="https://tlon.network/">https://tlon.network/</a> and log in there.
      </p>
      <p>
        After logging in, open landscape by going to <a class="site-link"
          href="https://sampel-palnet.tlon.network/apps/landscape">https://sampel-palnet.tlon.network/apps/landscape</a>
        (replace sampel-palnet with your ship's ID).
      </p>
      <p>
        Keep in mind that this probably won't work forever. As Nichess grows, it's unlikely that Tlon
        will want to give us so many free accounts.
      </p>
      <h3>1.3 Host your own ship</h3>
      <p>
        You probably don't want to do this as it's the most complicated option and will also cost you
        some money if you decide to use the cloud. If you still want to do it, follow <a class="site-link"
          href="https://docs.urbit.org/user-manual/running">these instructions</a>.
      </p>
      <h2>2. Install Nichess</h2>
      <p>Once you're logged in, open the terminal app and run:</p>
      <code class="code-line">|install ~riclur-macned %nichess</code>
      <h2>3. Find a game</h2>
      <p>
        Once you open the app, go to the Games page in the navigation bar and then click on Challenges.
        After you either accept a challenge or someone accepts your challenge, you'll need to select the
        game in the "Active Games" section before you can play.
      </p>
    </article>
  </main>
</template>

<script setup>
import { useHead } from '@unhead/vue'

useHead({
  title: 'Urbit Guide',
  link: [
    { rel: 'canonical', href: 'https://www.nichess.org/urbit' },
  ],
  meta: [
    { name: 'description', content: 'How to play Nichess on Urbit: get a ship, install the app, and play games against other players.' },
    { property: 'og:title', content: 'Urbit Guide' },
    { property: 'og:description', content: 'How to play Nichess on Urbit: get a ship, install the app, and play games against other players.' },
    { property: 'og:url', content: 'https://www.nichess.org/urbit' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: 'https://www.nichess.org/pwa-512x512.png' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: 'Urbit Guide' },
    { name: 'twitter:description', content: 'How to play Nichess on Urbit: get a ship, install the app, and play games against other players.' },
  ],
})
</script>
