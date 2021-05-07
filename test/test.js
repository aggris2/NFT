const Nft = artifacts.require('./Nft.sol')

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('Nft', ([deployer, author, tipper]) => {
  let nft

  before(async () => {
    nft = await Nft.deployed()
  })

  describe('deployment', async () => {
    it('deploys successfully', async () => {
      const address = await nft.address
      assert.notEqual(address, 0x0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)
    })

    it('has a name', async () => {
      const name = await nft.name()
      assert.equal(name, 'Nft')
    })
  })

  describe('images', async () => {
    let result, imageCount
    const hash = 'abc123'

    before(async () => {
      result = await nft.uploadImage(hash, 'Image description', { from: author })
      imageCount = await nft.imageCount()
    })

    it('creates images', async () => {
      assert.equal(imageCount, 1)
      const event = result.logs[0].args
      assert.equal(event.id.toNumber(), imageCount.toNumber(), 'id is correct')
      assert.equal(event.hash, hash, 'Hash is correct')
      assert.equal(event.description, 'Image description', 'description is correct')
      assert.equal(event.tipAmount, '0', 'tip amount is correct')

      await nft.uploadImage('', 'Image descriprion', { from: author }).should.be.rejected;
      await nft.uploadImage('Image hash', '', { from: author }).should.be.rejected;
    })

    it('lists images', async () => {
      const image = await nft.images(imageCount)
      assert.equal(image.id.toNumber(), imageCount.toNumber(), 'id is correct')
      assert.equal(image.hash, hash, 'Hash is correct')
      assert.equal(image.description, 'Image description', 'description is correct')
      assert.equal(image.tipAmount, '0', 'tip amount is correct')
      assert.equal(image.author, author, 'author is correct')
    })

    it('allows users to tip images', async () => {
      let oldAuthorBalance
      oldAuthorBalance = await web3.eth.getBalance(author)
      oldAuthorBalance = new web3.utils.BN(oldAuthorBalance)
      result = await nft.tipImageOwner(imageCount, { from: tipper, value: web3.utils.toWei('1', 'Ether') })

      const event = result.logs[0].args
      assert.equal(event.id.toNumber(), imageCount.toNumber(), 'id is correct')
      assert.equal(event.hash, hash, 'Hash is correct')
      assert.equal(event.description, 'Image description', 'description is correct')
      assert.equal(event.tipAmount, '1000000000000000000', 'tip amount is correct')
      assert.equal(event.author, author, 'author is correct')

      let newAuthorBalance
      newAuthorBalance = await web3.eth.getBalance(author)
      newAuthorBalance = new web3.utils.BN(newAuthorBalance)

      let tipImageOwner
      tipImageOwner = web3.utils.toWei('1', 'Ether')
      tipImageOwner = new web3.utils.BN(tipImageOwner)

      const expectedBalance = oldAuthorBalance.add(tipImageOwner)

      assert.equal(newAuthorBalance.toString(), expectedBalance.toString())

      await nft.tipImageOwner(99, { from: tipper, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected;
    })
  })
})